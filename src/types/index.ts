export type Participant = {
  id: string;
  roomId: string;
  username: string;
  sessionToken: string;
  totalPts: number;
};

export type Room = {
  id: string;
  code: string;
  name: string;
  ptsExact: number;
  ptsResult: number;
};

export type Prediction = {
  id: string;
  matchId: number;
  scoreHome: number;
  scoreAway: number;
  pointsEarned: number | null;
};