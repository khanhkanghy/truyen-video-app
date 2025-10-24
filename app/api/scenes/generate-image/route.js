/**
 * Image Generation API
 * Generate scene images using Fal.ai Stable Diffusion
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSceneImage } from '@/lib/ai/image-generation';

export async function POST(request) {
  try {
    const { sceneId } = await request.json();

    if (!sceneId) {
      return NextResponse.json(
        { error: 'Missing sceneId' },
        { status: 400 }
      );
    }

    console.log(`\n🎨 Generating image for scene: ${sceneId}`);

    // 1. Get scene data
    const { data: scene, error: fetchError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', sceneId)
      .single();

    if (fetchError || !scene) {
      console.error('❌ Scene not found:', fetchError);
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    console.log(`📝 Visual prompt: ${scene.visual_prompt?.substring(0, 100)}...`);

    // 2. Update status to generating
    await supabase
      .from('scenes')
      .update({ status: 'generating_image' })
      .eq('id', sceneId);

    // 3. Generate image with Fal.ai
    const imageUrl = await generateSceneImage(
      scene.visual_prompt,
      scene.negative_prompt
    );

    console.log(`✅ Image generated: ${imageUrl}`);

    // 4. Update scene with image URL
    const { error: updateError } = await supabase
      .from('scenes')
      .update({
        image_url: imageUrl,
        status: 'image_generated'
      })
      .eq('id', sceneId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log(`🎉 Scene updated successfully!\n`);

    return NextResponse.json({
      success: true,
      imageUrl,
      sceneId
    });

  } catch (error) {
    console.error('\n❌ Image generation error:', error);

    // Update status on error
    try {
      const body = await request.json();
      if (body.sceneId) {
        await supabase
          .from('scenes')
          .update({ status: 'failed' })
          .eq('id', body.sceneId);
      }
    } catch (e) {
      // Ignore
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - check image generation status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');

    if (!sceneId) {
      return NextResponse.json(
        { error: 'Missing sceneId' },
        { status: 400 }
      );
    }

    const { data: scene, error } = await supabase
      .from('scenes')
      .select('id, status, image_url')
      .eq('id', sceneId)
      .single();

    if (error || !scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      scene: {
        id: scene.id,
        status: scene.status,
        imageUrl: scene.image_url
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
