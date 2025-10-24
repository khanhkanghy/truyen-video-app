/**
 * Test script for LLM integration
 * Run: node scripts/test-llm.js
 */

import { analyzeSceneWithLLM, generateEnhancedPrompt } from '../lib/ai/llm.js';

// Test paragraph
const testParagraph = `
Trên đỉnh Ngọc Sơn, tuyết trắng phủ khắp nơi. Lý Tiểu Long ngồi xếp bằng,
tay kết ấn pháp, toàn thân tỏa ra hào quang xanh lục. Bỗng nhiên, một tiếng
nổ vang lên, linh khí thiên địa dồn dập đổ về. Hắn đã đột phá đến Kim Đan kỳ!
`.trim();

// Test characters
const testCharacters = [
  {
    name: 'Lý Tiểu Long',
    appearance_prompt: '1boy, handsome, black hair, blue cultivation robes, determined expression'
  }
];

console.log('🚀 Testing LLM Scene Analysis\n');
console.log('━'.repeat(60));
console.log('📝 Input Paragraph:');
console.log(testParagraph);
console.log('━'.repeat(60));

try {
  // Step 1: Analyze scene
  console.log('\n🔍 Step 1: Analyzing scene with GPT-4o-mini...\n');

  const analysis = await analyzeSceneWithLLM(testParagraph, 'Tiên hiệp', testCharacters);

  console.log('✅ Analysis Result:');
  console.log(JSON.stringify(analysis, null, 2));

  // Step 2: Generate visual prompt
  console.log('\n🎨 Step 2: Generating enhanced visual prompt...\n');

  const { visualPrompt, negativePrompt } = await generateEnhancedPrompt(
    analysis,
    'Tiên hiệp',
    testCharacters
  );

  console.log('━'.repeat(60));
  console.log('✅ VISUAL PROMPT:');
  console.log(visualPrompt);
  console.log('\n━'.repeat(60));
  console.log('❌ NEGATIVE PROMPT:');
  console.log(negativePrompt);
  console.log('━'.repeat(60));

  // Summary
  if (analysis._metadata) {
    console.log('\n📊 Metadata:');
    console.log(`  Model: ${analysis._metadata.model}`);
    console.log(`  Tokens: ${analysis._metadata.tokens}`);
    console.log(`  Cost: $${analysis._metadata.cost.toFixed(6)}`);
  }

  console.log('\n🎉 Test completed successfully!');
  console.log('\n💡 Next step: Copy visual prompt to Stable Diffusion and generate image!');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\n📝 Troubleshooting:');
  console.error('  1. Check if OPENAI_API_KEY is set in .env.local');
  console.error('  2. Make sure you have credits in your OpenAI account');
  console.error('  3. Run: npm install (to ensure dependencies are installed)');
  process.exit(1);
}
