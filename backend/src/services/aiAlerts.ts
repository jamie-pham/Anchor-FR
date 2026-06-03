import Anthropic from '@anthropic-ai/sdk';
import { EmergencyType, RiskLevel, Alert, Coordinates, WeatherData, FIRMSFireData, USGSEarthquakeFeature, TsunamiWarning } from '../types';
import { haversineDistanceKm, bearingDegrees } from './dataSources/nasaFirms';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AlertGenerationInput {
  emergencyType: EmergencyType;
  riskLevel: RiskLevel;
  riskScore: number;
  userLocation: Coordinates;
  weather?: WeatherData;
  fires?: FIRMSFireData[];
  earthquakes?: USGSEarthquakeFeature[];
  tsunamiWarnings?: TsunamiWarning[];
  language?: string;
}

export interface GeneratedAlert {
  headline: string;
  explanation: string;
  actions: string[];
  riskLevel: RiskLevel;
  riskScore: number;
}

const SYSTEM_PROMPT = `You are Anchor, an emergency alert assistant. Your job is to generate clear, calm, and actionable emergency alerts for people in danger.

Rules:
1. Write at a Grade 6 reading level — short sentences, plain words, no jargon.
2. State the specific risk: distance, direction, intensity. Use real numbers.
3. Give exactly 3 specific action steps. Each step should be concrete and doable right now.
4. Keep the headline under 10 words.
5. Keep the explanation under 60 words.
6. Never use phrases like "please be advised" or "it is recommended". Be direct.
7. Use the user's specified language.
8. Format your response as valid JSON only, with no other text.

Response format:
{
  "headline": "string",
  "explanation": "string",
  "actions": ["string", "string", "string"],
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "riskScore": number
}`;

function buildContextDescription(input: AlertGenerationInput): string {
  const { emergencyType, riskScore, riskLevel, userLocation, weather, fires, earthquakes, tsunamiWarnings, language } = input;
  const lang = language || 'English';

  let context = `Emergency type: ${emergencyType}\nRisk level: ${riskLevel} (score: ${riskScore}/100)\nUser language: ${lang}\n\n`;

  switch (emergencyType) {
    case 'wildfire': {
      if (fires && fires.length > 0) {
        const closestFire = fires.reduce((prev, cur) => {
          const prevDist = haversineDistanceKm(userLocation.lat, userLocation.lng, prev.latitude, prev.longitude);
          const curDist = haversineDistanceKm(userLocation.lat, userLocation.lng, cur.latitude, cur.longitude);
          return curDist < prevDist ? cur : prev;
        });
        const dist = Math.round(haversineDistanceKm(userLocation.lat, userLocation.lng, closestFire.latitude, closestFire.longitude));
        const bearing = bearingDegrees(userLocation.lat, userLocation.lng, closestFire.latitude, closestFire.longitude);
        const direction = bearingToCardinal(bearing);
        context += `Closest fire: ${dist} km to the ${direction}\nFire radiative power: ${closestFire.frp} MW\nConfidence: ${closestFire.confidence}%\n`;
      }
      if (weather) {
        context += `Wind: ${weather.windSpeed} km/h from ${bearingToCardinal((weather.windDirection + 180) % 360)}, gusting to ${weather.windGust} km/h\nTemperature: ${weather.temperature}°C\nHumidity: ${weather.humidity}%\n`;
      }
      break;
    }
    case 'earthquake': {
      if (earthquakes && earthquakes.length > 0) {
        const strongest = earthquakes.reduce((prev, cur) =>
          cur.properties.mag > prev.properties.mag ? cur : prev
        );
        const [lng, lat, depth] = strongest.geometry.coordinates;
        const dist = Math.round(haversineDistanceKm(userLocation.lat, userLocation.lng, lat, lng));
        const bearing = bearingDegrees(userLocation.lat, userLocation.lng, lat, lng);
        const direction = bearingToCardinal(bearing);
        context += `Strongest earthquake: M${strongest.properties.mag} at depth ${depth} km\nLocation: ${dist} km to the ${direction}\nPlace: ${strongest.properties.place}\n`;
      }
      break;
    }
    case 'flood': {
      if (weather) {
        context += `Rainfall last 24h: ${weather.precipitation24h} mm\nIn flood plain: ${weather.inFloodPlain ? 'Yes' : 'No'}\n`;
        if (weather.floodGaugeLevel !== null && weather.floodThreshold !== null) {
          const pct = Math.round((weather.floodGaugeLevel / weather.floodThreshold) * 100);
          context += `Flood gauge: ${weather.floodGaugeLevel}m (${pct}% of flood threshold ${weather.floodThreshold}m)\n`;
        }
      }
      break;
    }
    case 'storm': {
      if (weather) {
        context += `Wind speed: ${weather.windSpeed} km/h, gusting to ${weather.windGust} km/h\n`;
        if (weather.stormCategory !== null) context += `Storm category: ${weather.stormCategory}\n`;
        if (weather.stormDistance !== null) context += `Storm distance: ${weather.stormDistance} km\n`;
      }
      break;
    }
    case 'heat': {
      if (weather) {
        context += `Temperature: ${weather.temperature}°C, feels like ${weather.feelsLike}°C\nHours forecast above 40°C: ${weather.heatIndexForecast}\nUV index: ${weather.uvIndex}\n`;
      }
      break;
    }
    case 'tsunami': {
      if (tsunamiWarnings && tsunamiWarnings.length > 0) {
        const warning = tsunamiWarnings[0];
        context += `Warning level: ${warning.warningLevel}\nMax wave height: ${warning.maximumWaveHeight}m\nTime to arrival: ${warning.eta} minutes\nMagnitude of source quake: M${warning.magnitude}\n`;
      }
      break;
    }
  }

  return context;
}

export async function generateAlert(input: AlertGenerationInput): Promise<GeneratedAlert> {
  const context = buildContextDescription(input);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate an emergency alert for the following situation:\n\n${context}`,
      },
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  try {
    const parsed = JSON.parse(textContent.text) as GeneratedAlert;
    return {
      headline: parsed.headline,
      explanation: parsed.explanation,
      actions: parsed.actions.slice(0, 3),
      riskLevel: input.riskLevel,
      riskScore: input.riskScore,
    };
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${textContent.text}`);
  }
}

export async function generateAlertsForActiveRisks(
  inputs: AlertGenerationInput[]
): Promise<Alert[]> {
  const activeInputs = inputs.filter(i => i.riskLevel !== 'LOW' || i.riskScore >= 20);

  const alerts: Alert[] = await Promise.all(
    activeInputs.map(async (input) => {
      const generated = await generateAlert(input);
      const now = new Date();
      const expires = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours

      return {
        id: `${input.emergencyType}-${now.getTime()}`,
        emergencyType: input.emergencyType,
        riskLevel: generated.riskLevel,
        riskScore: generated.riskScore,
        headline: generated.headline,
        explanation: generated.explanation,
        actions: generated.actions,
        location: input.userLocation,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };
    })
  );

  return alerts.sort((a, b) => b.riskScore - a.riskScore);
}

function bearingToCardinal(bearing: number): string {
  const directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}
