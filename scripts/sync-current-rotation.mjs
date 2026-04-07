import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV_VARS = [
	'PROD_ROTATION_API_URL',
	'DEV_SUPABASE_URL',
	'DEV_SUPABASE_SERVICE_ROLE_KEY'
];

function getRequiredEnv(name) {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function parseArgs(argv) {
	const args = {
		dryRun: false,
		mapSlug: null
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--dry-run') {
			args.dryRun = true;
			continue;
		}

		if (arg === '--map') {
			args.mapSlug = argv[i + 1] ?? null;
			i += 1;
			continue;
		}
	}

	return args;
}

function normalizeSpawn(spawn, spawnIndex) {
	return {
		spawn_order: spawnIndex + 1,
		location: spawn.location,
		spawn_point: spawn.spawn_point ?? null,
		element: Array.isArray(spawn.attunements) ? spawn.attunements : []
	};
}

async function fetchProductionRotation(apiUrl) {
	const response = await fetch(apiUrl, {
		headers: {
			accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch production rotation: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

async function loadDevReferences(supabase) {
	const [{ data: maps, error: mapsError }, { data: challenges, error: challengesError }] =
		await Promise.all([
			supabase.from('maps').select('id, slug, name'),
			supabase.from('challenges').select('id, name, description')
		]);

	if (mapsError) throw new Error(`Failed to load dev maps: ${mapsError.message}`);
	if (challengesError) throw new Error(`Failed to load dev challenges: ${challengesError.message}`);

	return {
		mapsBySlug: new Map((maps ?? []).map((map) => [map.slug, map])),
		challengesByName: new Map((challenges ?? []).map((challenge) => [challenge.name, challenge]))
	};
}

function buildPayload(prodMap, weekStart, mapsBySlug, challengesByName) {
	const devMap = mapsBySlug.get(prodMap.slug);
	if (!devMap) {
		throw new Error(`Map "${prodMap.slug}" does not exist in dev`);
	}

	const challenges = [];
	const rounds = (prodMap.rounds ?? []).map((round) => {
		for (const challenge of round.challenges ?? []) {
			const devChallenge = challengesByName.get(challenge.name);
			if (!devChallenge) {
				throw new Error(
					`Challenge "${challenge.name}" (${challenge.description}) does not exist in dev`
				);
			}

			challenges.push({
				challenge_id: devChallenge.id,
				round_number: round.round
			});
		}

		return {
			round_number: round.round,
			waves: (round.waves ?? []).map((wave) => ({
				wave_number: wave.wave,
				spawns: (wave.spawns ?? []).map(normalizeSpawn)
			}))
		};
	});

	return {
		map_id: devMap.id,
		week_start: weekStart,
		credit_text: prodMap.credit_text ?? null,
		challenges,
		rounds
	};
}

async function importRotation(supabase, payload, dryRun) {
	if (dryRun) {
		return { rotationId: null };
	}

	const { data, error } = await supabase.rpc('upsert_rotation', {
		payload
	});

	if (error) {
		throw new Error(`Failed to import rotation for map ${payload.map_id}: ${error.message}`);
	}

	return { rotationId: data };
}

async function main() {
	for (const name of REQUIRED_ENV_VARS) {
		getRequiredEnv(name);
	}

	const { dryRun, mapSlug } = parseArgs(process.argv.slice(2));
	const prodRotationApiUrl = getRequiredEnv('PROD_ROTATION_API_URL');
	const devSupabaseUrl = getRequiredEnv('DEV_SUPABASE_URL');
	const devServiceRoleKey = getRequiredEnv('DEV_SUPABASE_SERVICE_ROLE_KEY');

	const prodData = await fetchProductionRotation(prodRotationApiUrl);
	const supabase = createClient(devSupabaseUrl, devServiceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	const { mapsBySlug, challengesByName } = await loadDevReferences(supabase);
	const allMaps = Array.isArray(prodData.maps) ? prodData.maps : [];
	const selectedMaps = mapSlug ? allMaps.filter((map) => map.slug === mapSlug) : allMaps;

	if (selectedMaps.length === 0) {
		throw new Error(
			mapSlug
				? `No production rotation found for map slug "${mapSlug}"`
				: 'No maps returned from production rotation API'
		);
	}

	console.log(
		`${dryRun ? 'Dry run for' : 'Syncing'} ${selectedMaps.length} map(s) for week ${prodData.week_start}`
	);

	for (const prodMap of selectedMaps) {
		const payload = buildPayload(prodMap, prodData.week_start, mapsBySlug, challengesByName);
		const { rotationId } = await importRotation(supabase, payload, dryRun);
		console.log(
			[
				prodMap.slug,
				dryRun ? 'validated' : 'imported',
				`rounds=${payload.rounds.length}`,
				`challenges=${payload.challenges.length}`,
				rotationId ? `rotation_id=${rotationId}` : null
			]
				.filter(Boolean)
				.join(' ')
		);
	}
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
