const { estimateCalories } = require('./lib/gemini.ts');

async function run() {
  try {
    const res = await estimateCalories("1 apple");
    console.log("Success:", res);
  } catch (err) {
    console.error("Test Failed:", err);
  }
}
run();
