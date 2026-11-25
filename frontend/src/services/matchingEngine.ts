import { Volunteer, NeedReport } from '../types';

/**
 * Haversine formula to compute great-circle distance between two coordinates in kilometers.
 * Exactly as proposed in section 1.4 of ReliefNet Synopsis Report.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Match volunteers against a reported need:
 * - Computes distance via Haversine
 * - Evaluates skill overlap score
 * - Factors volunteer rating & status
 * - Ranks and returns top matches with transparent AI explanation
 */
export function rankVolunteersForNeed(
  need: NeedReport,
  volunteers: Volunteer[]
): Volunteer[] {
  return volunteers
    .filter((v) => v.status === 'AVAILABLE')
    .map((v) => {
      const distance = calculateHaversineDistance(
        need.location.lat,
        need.location.lng,
        v.location.lat,
        v.location.lng
      );

      // Skill overlap
      const matchingSkills = v.skills.filter((skill) =>
        need.requiredSkills.some(
          (req) => req.toLowerCase() === skill.toLowerCase()
        )
      );
      const skillScore = need.requiredSkills.length > 0
        ? (matchingSkills.length / need.requiredSkills.length) * 50
        : 35;

      // Distance score (max 40 pts, decreases as distance increases)
      const distanceScore = Math.max(5, 40 - distance * 4.5);

      // Experience score (up to 10 pts based on real completed missions;
      // the backend keeps no rating column, so nothing is invented here)
      const expScore = Math.min(10, v.completedMissions);

      const totalScore = Math.min(99, Math.round(skillScore + distanceScore + expScore));

      const reason = matchingSkills.length > 0
        ? `${distance} km away. Possesses key skills: ${matchingSkills.join(', ')} (${Math.round(totalScore)}% match).`
        : `Close proximity (${distance} km), available for general deployment.`;

      return {
        ...v,
        distanceKm: distance,
        matchScore: totalScore,
        matchReason: reason
      };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
