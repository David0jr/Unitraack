import { api } from '../../../lib/axios';

export const tenantService = {
  async getTenantInfo(slug: string) {
    const response = await api.get(`/auth/tenant-info?slug=${slug}`, {
      headers: {
        'X-Tenant-Slug': slug
      }
    });
    return response.data.data;
  }
};

