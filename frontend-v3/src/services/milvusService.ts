/**
 * Milvus Database Service
 * Direct connection to GCP Milvus instance for frontend operations
 */

export interface MilvusConnection {
  host: string;
  port: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastChecked: string;
}

export interface CollectionInfo {
  name: string;
  description: string;
  entityCount: number;
  fields: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export interface SearchResult {
  id: string;
  score: number;
  entity: any;
  collection: string;
}

class MilvusService {
  private connection: MilvusConnection = {
    host: '34.60.125.249',
    port: '19530',
    status: 'disconnected',
    lastChecked: new Date().toISOString()
  };

  private baseUrl = 'http://localhost:8804'; // Backend proxy for Milvus operations

  /**
   * Check Milvus connection status
   */
  async checkConnection(): Promise<MilvusConnection> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      
      this.connection.status = data.milvus_connected ? 'connected' : 'disconnected';
      this.connection.lastChecked = new Date().toISOString();
      
      return this.connection;
    } catch (error) {
      this.connection.status = 'disconnected';
      this.connection.lastChecked = new Date().toISOString();
      return this.connection;
    }
  }

  /**
   * Get collection information
   */
  async getCollections(): Promise<CollectionInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/milvus/collections`);
      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  /**
   * Search in Milvus collections
   */
  async search(query: string, collection?: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/search/semantic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          type: collection || 'both',
          limit
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return data.results?.resumes?.map((item: any) => ({
        id: item.id,
        score: item.score,
        entity: item,
        collection: 'resumes'
      })).concat(
        data.results?.jobs?.map((item: any) => ({
          id: item.id,
          score: item.score,
          entity: item,
          collection: 'jobs'
        })) || []
      ) || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/milvus/collections/${collectionName}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch collection stats');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching collection stats:', error);
      return null;
    }
  }

  /**
   * Insert data into collection
   */
  async insertData(collectionName: string, data: any[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/milvus/collections/${collectionName}/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data })
      });

      return response.ok;
    } catch (error) {
      console.error('Insert error:', error);
      return false;
    }
  }

  /**
   * Delete data from collection
   */
  async deleteData(collectionName: string, ids: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/milvus/collections/${collectionName}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids })
      });

      return response.ok;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): MilvusConnection {
    return this.connection;
  }
}

export const milvusService = new MilvusService();
