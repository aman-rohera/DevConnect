export default class PerformanceReporter {
  onInit(ctx) {
    this.ctx = ctx;
    this.slowTests = [];
    this.failedTests = [];
  }

  onTaskUpdate(packs) {
    for (const pack of packs) {
      const id = pack[0];
      const result = pack[1];
      if (!result) continue;

      const task = this.ctx.state.idMap.get(id);
      if (task && task.type === 'test') {
        const duration = result.duration;
        // Collect slow tests (> 300ms)
        if (duration && duration > 300) {
          this.slowTests.push({
            name: task.name,
            file: task.file?.name || 'unknown',
            duration
          });
        }
        // Collect failed tests
        if (result.state === 'fail') {
          this.failedTests.push({
            name: task.name,
            errors: result.errors
          });
        }
      }
    }
  }

  onFinished(files, errors) {
    // Print Slow Endpoints Warnings
    if (this.slowTests.length > 0) {
      console.log('\n\x1b[33m[PERFORMANCE WARNING] The following tests/endpoints exceeded 300ms:\x1b[0m');
      this.slowTests.forEach(test => {
        console.log(`  \x1b[33m⚠ [${Math.round(test.duration)}ms] - ${test.name} (${test.file})\x1b[0m`);
      });
      console.log('\x1b[33m---------------------------------------------------------------\x1b[0m');
    }

    // Print Failed API details summary if any
    if (this.failedTests.length > 0) {
      console.log('\n\x1b[31m[FAILED API DETAILS SUMMARY]:\x1b[0m');
      this.failedTests.forEach(test => {
        console.log(`  \x1b[31m✗ ${test.name}\x1b[0m`);
        test.errors?.forEach(err => {
          console.log(`    Error: ${err.message}`);
          if (err.stackStr) {
            console.log(`    Stack: ${err.stackStr.split('\n')[0]}`);
          }
        });
      });
      console.log('\x1b[31m---------------------------------------------------------------\x1b[0m');
    }
  }
}
