/**
 * E2E Test Suite Master Runner - Community Resource Hub
 * Runs Tiers 1-4 opaque-box E2E test suites cleanly and outputs execution metrics.
 */
import { runTier1Tests } from './tier1_feature_coverage.js';
import { runTier2Tests } from './tier2_boundary_edge_cases.js';
import { runTier3Tests } from './tier3_cross_feature_interactions.js';
import { runTier4Tests } from './tier4_real_world_scenarios.js';

async function executeTestSuite() {
  console.log('\n================================================================');
  console.log(' COMMUNITY RESOURCE HUB - E2E TEST SUITE RUNNER');
  console.log(' Method: Opaque-Box E2E Testing (Tiers 1 - 4)');
  console.log('================================================================\n');

  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  const tierSummaries = [];

  const tiers = [
    { id: 1, name: 'Tier 1: Feature Coverage', getTests: runTier1Tests },
    { id: 2, name: 'Tier 2: Boundary & Edge Cases', getTests: runTier2Tests },
    { id: 3, name: 'Tier 3: Cross-Feature Interactions', getTests: runTier3Tests },
    { id: 4, name: 'Tier 4: Real-world Application Scenarios', getTests: runTier4Tests }
  ];

  for (const tier of tiers) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(` ▶ RUNNING ${tier.name.toUpperCase()}`);
    console.log(`----------------------------------------------------------------`);

    const tierStartTime = Date.now();
    let tierPassed = 0;
    let tierFailed = 0;
    const tests = await tier.getTests();

    for (const test of tests) {
      const testStart = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - testStart;
        console.log(`  ✓ PASS: ${test.name} (${duration}ms)`);
        tierPassed++;
        totalPassed++;
      } catch (err) {
        const duration = Date.now() - testStart;
        console.error(`  ✗ FAIL: ${test.name} (${duration}ms)`);
        console.error(`    Error: ${err.message}`);
        if (err.stack) {
          const firstStackLine = err.stack.split('\n')[1];
          if (firstStackLine) console.error(`    ${firstStackLine.trim()}`);
        }
        tierFailed++;
        totalFailed++;
      }
    }

    const tierDuration = Date.now() - tierStartTime;
    tierSummaries.push({
      tier: tier.name,
      passed: tierPassed,
      failed: tierFailed,
      total: tests.length,
      durationMs: tierDuration
    });
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n================================================================');
  console.log(' E2E TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================');
  console.table(tierSummaries);

  console.log(`\nOverall Metrics:`);
  console.log(`  Total Test Suites : ${tiers.length}`);
  console.log(`  Total Tests Run   : ${totalPassed + totalFailed}`);
  console.log(`  Passed Tests      : ${totalPassed}`);
  console.log(`  Failed Tests      : ${totalFailed}`);
  console.log(`  Total Execution   : ${totalDuration}ms`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    console.error(`❌ E2E TEST SUITE FAILED with ${totalFailed} failure(s).\n`);
    process.exit(1);
  } else {
    console.log(`✅ ALL E2E TESTS PASSED SUCCESSFULLY (100% Pass Rate).\n`);
    process.exit(0);
  }
}

executeTestSuite().catch(err => {
  console.error('Fatal error during E2E test execution:', err);
  process.exit(1);
});
