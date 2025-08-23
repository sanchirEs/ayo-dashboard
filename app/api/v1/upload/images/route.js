import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const images = formData.getAll('images');
    const folder = formData.get('folder') || 'products';
    const type = formData.get('type') || 'products';

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No images provided' },
        { status: 400 }
      );
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing');
      return NextResponse.json(
        { success: false, message: 'Image upload service not configured' },
        { status: 500 }
      );
    }

    const uploadedImages = [];
    const errors = [];

    // Upload each image to Cloudinary
    for (const image of images) {
      try {
        // Convert file to buffer
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: `ayo-dashboard/${folder}`,
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
              ],
              // Generate additional sizes
              eager: [
                { width: 300, height: 300, crop: 'fill' }, // Thumbnail
                { width: 600, height: 600, crop: 'limit' }, // Medium
              ],
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(buffer);
        });

        // Format the response to match what the frontend expects
        const imageData = {
          id: result.public_id,
          url: result.secure_url,
          secure_url: result.secure_url,
          optimized_url: result.secure_url,
          thumbnail_url: result.eager?.[0]?.secure_url || result.secure_url,
          original_filename: image.name,
          size: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
          created_at: result.created_at,
        };

        uploadedImages.push(imageData);
        
      } catch (uploadError) {
        console.error(`Failed to upload ${image.name}:`, uploadError);
        errors.push(`Failed to upload ${image.name}: ${uploadError.message}`);
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'All uploads failed', 
          errors 
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`,
        data: {
          images: uploadedImages,
          total: uploadedImages.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

