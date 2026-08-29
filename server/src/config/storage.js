const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const config = require('./env');
const logger = require('../utils/logger');

// Ensure local upload directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

let supabaseClient = null;
if (config.SUPABASE_URL && config.SUPABASE_KEY) {
  try {
    supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
    logger.info('Initialized Supabase Storage client for production document storage');
  } catch (err) {
    logger.warn('Failed to initialize Supabase Storage client, using local file storage:', { error: err.message });
  }
}

const storageService = {
  getProvider: () => {
    return supabaseClient && config.STORAGE_PROVIDER === 'supabase' ? 'supabase' : 'local';
  },

  uploadFile: async (fileBuffer, filename, mimeType) => {
    const isSupabase = supabaseClient && config.STORAGE_PROVIDER === 'supabase';

    if (isSupabase) {
      try {
        const filePath = `documents/${Date.now()}_${filename}`;
        const { data, error } = await supabaseClient.storage
          .from(config.SUPABASE_BUCKET)
          .upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) throw error;

        const { data: publicUrlData } = supabaseClient.storage
          .from(config.SUPABASE_BUCKET)
          .getPublicUrl(filePath);

        return {
          provider: 'supabase',
          filePath: data.path,
          publicUrl: publicUrlData?.publicUrl || null,
        };
      } catch (err) {
        logger.warn('Supabase upload failed, storing locally:', { error: err.message });
      }
    }

    // Local Disk Storage
    const localFileName = `${Date.now()}_${filename}`;
    const destination = path.join(config.UPLOAD_DIR, localFileName);
    fs.writeFileSync(destination, fileBuffer);

    return {
      provider: 'local',
      filePath: destination,
      publicUrl: null,
    };
  },

  getFileStream: async (filePath, provider = 'local') => {
    if (provider === 'supabase' && supabaseClient) {
      const { data, error } = await supabaseClient.storage
        .from(config.SUPABASE_BUCKET)
        .download(filePath);
      if (error) throw error;
      return Buffer.from(await data.arrayBuffer());
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    return fs.readFileSync(filePath);
  },

  deleteFile: async (filePath, provider = 'local') => {
    if (provider === 'supabase' && supabaseClient) {
      await supabaseClient.storage.from(config.SUPABASE_BUCKET).remove([filePath]);
      return;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },
};

module.exports = storageService;
