import { Match } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface RawServer {
  name: string;
  stream_url: string;
  referer?: string;
}

interface RawMatch {
  match_time: string;
  match_status: string;
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  league_name: string;
  match_score: string | null;
  servers: RawServer[];
}

// Convert unix timestamp (seconds) to "HH:MM DD/MM/YYYY" format
const formatUnixTime = (unix: string): string => {
  const ts = parseInt(unix, 10) * 1000;
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Generate a stable ID from match data
const generateStableId = (home: string, away: string, time: string): string => {
  const raw = `${(home || '').trim()}-${(away || '').trim()}-${(time || '').trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `m${Math.abs(hash).toString(36)}`;
};

export const footballAPI = {
  getMatches: async (): Promise<Match[]> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/matches-proxy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data: RawMatch[] = await response.json();
      
      return (data || []).map((raw) => {
        const time = formatUnixTime(raw.match_time);
        const id = generateStableId(raw.home_team_name, raw.away_team_name, raw.match_time);
        
        // Map API status to our status
        let apiStatus = raw.match_status;
        
        // Map servers to authors format
        const authors = (raw.servers || []).map((server) => ({
          name: server.name || 'Stream',
          url: server.stream_url,
          logo: '',
          referer: server.referer || '',
        }));

        return {
          id,
          view_url: '',
          label: raw.league_name || '',
          time,
          home_logo: raw.home_team_logo || '',
          home_name: raw.home_team_name || '',
          score: raw.match_score || 'vs',
          away_logo: raw.away_team_logo || '',
          away_name: raw.away_team_name || '',
          url: '',
          authors,
          api_status: apiStatus,
        };
      });
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};
