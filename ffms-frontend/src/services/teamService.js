import api from "./api";

/**
 * Farm Team & Staff Management Service
 */
export const teamService = {
  async getMembers(farmId) {
    const res = await api.get(`/api/farms/${farmId}/members`);
    return res.data || [];
  },

  async inviteOrAddMember(farmId, payload) {
    const res = await api.post(`/api/farms/${farmId}/members`, payload);
    return res;
  },

  async updateMember(farmId, memberId, payload) {
    const res = await api.patch(`/api/farms/${farmId}/members/${memberId}`, payload);
    return res;
  },

  async removeMember(farmId, memberId) {
    const res = await api.delete(`/api/farms/${farmId}/members/${memberId}`);
    return res;
  },
};

export default teamService;
