import express from 'express';
import { Protocol, ProtocolAttribute } from '../../types/protocols';
import { Pool } from 'pg';

interface ProtocolParams {
  id: string;
  slug: string;
  type?: string;
}

// Create a router
const router = express.Router();

// Get database pool from app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@supabase-db:5432/supabase?sslmode=disable',
});

// Once on startup, verify DB connection
pool.query('SELECT NOW()')
  .then(() => console.log('Successfully connected to PostgreSQL for protocols module'))
  .catch(err => console.error('Failed to connect to PostgreSQL:', err));

router.get('/', async (req, res) => {
  try {
    // Log the request for debugging
    console.log('Fetching all protocols with direct PostgreSQL connection');
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pa.id,
            'name', pa.name,
            'slug', pa.slug,
            'description', pa.description,
            'type', pa.type,
            'is_active', pa.is_active
          )
        ) as protocol_attributes
      FROM 
        protocols p
      LEFT JOIN 
        protocol_attributes pa ON p.protocol_attribute_id = pa.id
      GROUP BY 
        p.id
      ORDER BY 
        p.name
    `);
    
    return res.status(200).json(result.rows as Protocol[]);
  } catch (error: any) {
    console.error('Error fetching protocols:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch protocols',
      details: error.message || 'Unknown error' 
    });
  }
});

// Get all protocols for a specific attribute type
router.get('/by-type/:type', async (req, res) => {
  const { type } = req.params as ProtocolParams;
  
  try {
    console.log(`Fetching protocols for type ${type}`);
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pa.id,
            'name', pa.name,
            'slug', pa.slug,
            'description', pa.description,
            'type', pa.type,
            'is_active', pa.is_active
          )
        ) as protocol_attributes
      FROM 
        protocols p
      INNER JOIN 
        protocol_attributes pa ON p.protocol_attribute_id = pa.id
      WHERE 
        pa.type = $1
      GROUP BY 
        p.id
      ORDER BY 
        p.name
    `, [type]);
    
    return res.status(200).json(result.rows as Protocol[]);
  } catch (error: any) {
    console.error(`Error fetching protocols for type ${type}:`, error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch protocols by type',
      details: error.message || 'Unknown error'
    });
  }
});

// Get a single protocol by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params as ProtocolParams;
  
  try {
    console.log(`Fetching protocol with ID ${id}`);
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pa.id,
            'name', pa.name,
            'slug', pa.slug,
            'description', pa.description,
            'type', pa.type,
            'is_active', pa.is_active
          )
        ) as protocol_attributes
      FROM 
        protocols p
      LEFT JOIN 
        protocol_attributes pa ON p.protocol_attribute_id = pa.id
      WHERE 
        p.id = $1
      GROUP BY 
        p.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }
    
    return res.status(200).json(result.rows[0] as Protocol);
  } catch (error: any) {
    console.error(`Error fetching protocol ${id}:`, error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch protocol',
      details: error.message || 'Unknown error'
    });
  }
});

// Get a single protocol by slug
router.get('/slug/:slug', async (req, res) => {
  const { slug } = req.params as ProtocolParams;
  
  try {
    console.log(`Fetching protocol with slug ${slug}`);
    
    const result = await pool.query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pa.id,
            'name', pa.name,
            'slug', pa.slug,
            'description', pa.description,
            'type', pa.type,
            'is_active', pa.is_active
          )
        ) as protocol_attributes
      FROM 
        protocols p
      LEFT JOIN 
        protocol_attributes pa ON p.protocol_attribute_id = pa.id
      WHERE 
        p.slug = $1
      GROUP BY 
        p.id
    `, [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }
    
    return res.status(200).json(result.rows[0] as Protocol);
  } catch (error: any) {
    console.error(`Error fetching protocol with slug ${slug}:`, error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch protocol',
      details: error.message || 'Unknown error'
    });
  }
});

// Get all protocol attributes
router.get('/attributes/all', async (req, res) => {
  try {
    console.log('Fetching all protocol attributes');
    
    const result = await pool.query(`
      SELECT * FROM protocol_attributes
      ORDER BY name
    `);
    
    // Add icon data from mocks
    const enhancedData = result.rows.map(attr => {
      // This is a placeholder for icon mapping - in a real app you might want to store this in the DB
      const iconMap: Record<string, string> = {
        'age': '📋',
        'email': '📧',
        'events': '📅',
        'gender': '👤',
        'residency': '🌐',
        'income': '💲',
        'ethereum_staker': '♦',
        'attestation': '📄',
        'followers': '👥'
      };
      
      return {
        ...attr,
        icon: iconMap[attr.type] || '📄' // Default icon if not found
      };
    });
    
    return res.status(200).json(enhancedData as ProtocolAttribute[]);
  } catch (error: any) {
    console.error('Error fetching protocol attributes:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch protocol attributes',
      details: error.message || 'Unknown error'
    });
  }
});

// Get protocol attributes by type
router.get('/attributes/type/:type', async (req, res) => {
  const { type } = req.params as ProtocolParams;
  
  try {
    console.log(`Fetching protocol attributes for type ${type}`);
    
    const result = await pool.query(`
      SELECT * FROM protocol_attributes
      WHERE type = $1
      ORDER BY name
    `, [type]);
    
    // Same icon mapping as above
    const enhancedData = result.rows.map(attr => {
      const iconMap: Record<string, string> = {
        'age': '📋',
        'email': '📧',
        'events': '📅',
        'gender': '👤',
        'residency': '🌐',
        'income': '💲',
        'ethereum_staker': '♦',
        'attestation': '📄',
        'followers': '👥'
      };
      
      return {
        ...attr,
        icon: iconMap[attr.type] || '📄'
      };
    });
    
    return res.status(200).json(enhancedData as ProtocolAttribute[]);
  } catch (error: any) {
    console.error(`Error fetching protocol attributes for type ${type}:`, error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch protocol attributes by type',
      details: error.message || 'Unknown error'
    });
  }
});

export default router; 