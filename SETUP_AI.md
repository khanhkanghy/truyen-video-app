# 🚀 HƯỚNG DẪN SETUP AI - BƯỚC ĐẦU TIÊN

## ✅ BƯỚC 1: Lấy API Keys (5 phút)

### 1.1. OpenAI API Key (BẮT BUỘC)

1. Truy cập: https://platform.openai.com/api-keys
2. Đăng nhập/đăng ký account
3. Click "Create new secret key"
4. Copy key (dạng: `sk-proj-xxxxx`)
5. **Nạp tiền:** Vào https://platform.openai.com/settings/organization/billing
   - Minimum: $5 (đủ dùng cho 500+ chapters!)
   - Credit card hoặc PayPal

### 1.2. Fal.ai API Key (TÙY CHỌN - cho image generation)

1. Truy cập: https://fal.ai/dashboard/keys
2. Sign in với Google/GitHub
3. Copy "API Key"
4. **Nạp tiền:** $5-10 (1 image = $0.004)

---

## ✅ BƯỚC 2: Cấu hình API Keys

Mở file `.env.local` và paste API keys vào:

```bash
# Supabase (GIỮ NGUYÊN - đã có sẵn)
NEXT_PUBLIC_SUPABASE_URL=your_existing_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_supabase_key

# OpenAI - PASTE KEY VÀO ĐÂY
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Fal.ai - PASTE KEY VÀO ĐÂY (nếu muốn generate images)
FAL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**⚠️ LƯU Ý:**
- Không commit file `.env.local` lên GitHub!
- File `.gitignore` đã exclude `.env.local` rồi

---

## ✅ BƯỚC 3: Chạy thử ngay! (2 phút)

### 3.1. Start Dev Server

```bash
npm run dev
```

### 3.2. Test AI Analysis

1. Mở: http://localhost:3000/upload
2. Chọn/tạo bộ truyện
3. Paste đoạn văn test:

```
Trên đỉnh Ngọc Sơn, tuyết trắng phủ khắp nơi. Lý Tiểu Long ngồi xếp bằng, tay kết ấn pháp, toàn thân tỏa ra hào quang xanh lục.

Bỗng nhiên, một tiếng nổ vang lên, linh khí thiên địa dồn dập đổ về. Hắn đã đột phá đến Kim Đan kỳ!

"Cuối cùng cũng thành công!" Hắn mở mắt, ánh mắt sắc bén như kiếm.
```

4. Click "Phân tích & Tạo cảnh"
5. Xem kết quả trong Console (Terminal)

### 3.3. Kiểm tra logs

Trong terminal, bạn sẽ thấy:

```
🚀 Starting AI-powered chapter analysis...
📚 Series ID: xxx
📖 Chapter: 1
📝 Content length: 250 characters

✅ Series loaded: Tu Tiên Truyện (Tiên hiệp)
👥 Characters: 0

🔍 Analyzing chapter with AI...
📄 Found 3 paragraphs

[1/3] Analyzing paragraph...
🤖 Calling OpenAI GPT-4o-mini for scene analysis...
✅ LLM Analysis completed: { scene_type: 'action', characters: 1, mood: 'dramatic' }
  ✓ Type: action
  ✓ Characters: 0
  ✓ Mood: dramatic
🎨 Generating enhanced visual prompt...
✅ Visual prompt generated

💰 Total AI cost: $0.0023

✅ Chapter saved: xxx-xxx-xxx
✅ Paragraphs saved: 3
✅ Scenes saved: 6

🎉 Chapter analysis completed successfully!
```

**✅ THÀNH CÔNG!** Nếu thấy logs như trên là đã hoạt động!

---

## ✅ BƯỚC 4: Test Image Generation (TÙY CHỌN)

**Chỉ làm nếu đã có FAL_KEY!**

### 4.1. Tạo test script

```bash
# Create test file
cat > scripts/test-image-gen.js << 'EOF'
import { generateSceneImage } from '../lib/ai/image-generation.js';

const prompt = `
A handsome young cultivator in blue robes sits cross-legged on a snow-covered mountain peak,
surrounded by swirling green mystical energy, dramatic lighting, cinematic composition,
chinese xianxia fantasy style, ancient pine trees, jade mountain summit,
breakthrough moment, spiritual energy explosion, high quality, detailed, 4k
`;

const negativePrompt = `blurry, low quality, distorted, ugly, bad anatomy`;

console.log('🎨 Testing image generation...\n');
console.log('Prompt:', prompt);

const imageUrl = await generateSceneImage(prompt, negativePrompt);

console.log('\n✅ Success!');
console.log('Image URL:', imageUrl);
console.log('\nOpen this URL in browser to see the image!');
EOF
```

### 4.2. Chạy test

```bash
node scripts/test-image-gen.js
```

Sau ~10-15 giây, bạn sẽ nhận được URL. Mở URL đó trong browser để xem ảnh!

---

## 📊 Chi phí ước tính

### OpenAI GPT-4o-mini
- 1 paragraph analysis: ~$0.0008
- 1 chapter (10 paragraphs): ~$0.008
- 100 chapters: ~$0.80

### Fal.ai Images
- 1 image: $0.004
- 1 chapter (20 scenes): $0.08
- 100 chapters: $8.00

**TỔNG: ~$9/100 chapters = Rất rẻ!**

---

## 🐛 Troubleshooting

### Lỗi: "Missing OPENAI_API_KEY"
✅ Kiểm tra file `.env.local` đã có `OPENAI_API_KEY=sk-proj-...`
✅ Restart dev server: `Ctrl+C` rồi `npm run dev`

### Lỗi: "Incorrect API key"
✅ Check API key có đúng không
✅ Check đã nạp tiền vào account chưa

### Lỗi: "Rate limit exceeded"
✅ Bạn đang gọi quá nhiều, chờ 1 phút rồi thử lại

### Lỗi: "Module not found"
✅ Chạy: `npm install`

---

## 🎉 Hoàn tất!

Bạn đã setup xong! Giờ có thể:

✅ Upload chapters → AI tự động phân tích
✅ Tạo visual prompts chất lượng cao
✅ Detect nhân vật, location, mood chính xác
✅ Generate images (nếu có FAL_KEY)

---

## 📚 Next Steps

1. ✅ **Đã xong:** AI-powered text analysis
2. 🚀 **Tiếp theo:** Generate images cho scenes
3. 🎬 **Sau đó:** Video generation pipeline
4. 🎨 **Advanced:** Character LoRA training

Chúc bạn thành công! 🚀
