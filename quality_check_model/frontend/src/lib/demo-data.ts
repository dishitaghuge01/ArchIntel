import { FloorPlanAnalysis } from './types';

const modernApartmentSvg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="380" height="280" fill="none" stroke="currentColor" stroke-width="2"/><line x1="200" y1="10" x2="200" y2="180" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="180" x2="380" y2="180" stroke="currentColor" stroke-width="1.5"/><line x1="120" y1="180" x2="120" y2="290" stroke="currentColor" stroke-width="1.5"/><text x="100" y="100" font-size="11" fill="currentColor" text-anchor="middle">Living Room</text><text x="300" y="100" font-size="11" fill="currentColor" text-anchor="middle">Master Bed</text><text x="65" y="240" font-size="10" fill="currentColor" text-anchor="middle">Kitchen</text><text x="250" y="240" font-size="10" fill="currentColor" text-anchor="middle">Dining</text></svg>`;

const officeSvg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="380" height="280" fill="none" stroke="currentColor" stroke-width="2"/><line x1="10" y1="100" x2="300" y2="100" stroke="currentColor" stroke-width="1.5"/><line x1="300" y1="10" x2="300" y2="290" stroke="currentColor" stroke-width="1.5"/><line x1="150" y1="100" x2="150" y2="290" stroke="currentColor" stroke-width="1.5"/><text x="150" y="60" font-size="11" fill="currentColor" text-anchor="middle">Open Office</text><text x="80" y="200" font-size="10" fill="currentColor" text-anchor="middle">Meeting A</text><text x="225" y="200" font-size="10" fill="currentColor" text-anchor="middle">Meeting B</text><text x="340" y="150" font-size="10" fill="currentColor" text-anchor="middle">Server</text></svg>`;

const villaSvg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="380" height="280" fill="none" stroke="currentColor" stroke-width="2"/><line x1="200" y1="10" x2="200" y2="290" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="150" x2="200" y2="150" stroke="currentColor" stroke-width="1.5"/><line x1="200" y1="100" x2="390" y2="100" stroke="currentColor" stroke-width="1.5"/><line x1="200" y1="200" x2="390" y2="200" stroke="currentColor" stroke-width="1.5"/><text x="100" y="85" font-size="11" fill="currentColor" text-anchor="middle">Grand Living</text><text x="100" y="220" font-size="10" fill="currentColor" text-anchor="middle">Kitchen</text><text x="295" y="60" font-size="10" fill="currentColor" text-anchor="middle">Master Suite</text><text x="295" y="155" font-size="10" fill="currentColor" text-anchor="middle">Bedroom 2</text><text x="295" y="250" font-size="10" fill="currentColor" text-anchor="middle">Study</text></svg>`;

const studioSvg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="380" height="280" fill="none" stroke="currentColor" stroke-width="2"/><line x1="10" y1="200" x2="250" y2="200" stroke="currentColor" stroke-width="1.5"/><line x1="250" y1="10" x2="250" y2="290" stroke="currentColor" stroke-width="1.5"/><text x="130" y="110" font-size="11" fill="currentColor" text-anchor="middle">Living / Sleeping</text><text x="130" y="250" font-size="10" fill="currentColor" text-anchor="middle">Kitchenette</text><text x="325" y="150" font-size="10" fill="currentColor" text-anchor="middle">Bathroom</text></svg>`;

export const DEMO_PLANS: FloorPlanAnalysis[] = [
  {
    id: 'demo-1',
    name: 'Modern Apartment',
    timestamp: Date.now() - 86400000 * 2,
    svgContent: modernApartmentSvg,
    totalArea: 85.4,
    roomCount: 4,
    rooms: [
      { name: 'Living Room', area: 28.5 },
      { name: 'Master Bedroom', area: 22.0 },
      { name: 'Kitchen', area: 15.2 },
      { name: 'Dining Area', area: 19.7 },
    ],
    dqiScore: 82,
    qualityClass: 'Good',
    suggestions: [
      { severity: 'info', message: 'Consider adding a hallway buffer between living room and bedroom for noise isolation.' },
      { severity: 'warning', message: 'Kitchen area is below recommended 18 m² for apartments of this size.' },
      { severity: 'info', message: 'Natural lighting ratio is excellent at 0.85.' },
    ],
    chatHistory: [],
  },
  {
    id: 'demo-2',
    name: 'Office Layout',
    timestamp: Date.now() - 86400000,
    svgContent: officeSvg,
    totalArea: 220.0,
    roomCount: 4,
    rooms: [
      { name: 'Open Office', area: 130.0 },
      { name: 'Meeting Room A', area: 35.0 },
      { name: 'Meeting Room B', area: 35.0 },
      { name: 'Server Room', area: 20.0 },
    ],
    dqiScore: 91,
    qualityClass: 'Excellent',
    suggestions: [
      { severity: 'info', message: 'Open office exceeds recommended desk density—consider adding partitions.' },
      { severity: 'info', message: 'Excellent emergency egress pathways detected.' },
    ],
    chatHistory: [],
  },
  {
    id: 'demo-3',
    name: 'Villa Design',
    timestamp: Date.now() - 3600000 * 5,
    svgContent: villaSvg,
    totalArea: 310.5,
    roomCount: 5,
    rooms: [
      { name: 'Grand Living', area: 85.0 },
      { name: 'Kitchen', area: 45.0 },
      { name: 'Master Suite', area: 72.0 },
      { name: 'Bedroom 2', area: 55.5 },
      { name: 'Study', area: 53.0 },
    ],
    dqiScore: 74,
    qualityClass: 'Good',
    suggestions: [
      { severity: 'warning', message: 'Study room lacks direct exterior window—consider adding a skylight.' },
      { severity: 'critical', message: 'Master suite requires a second egress point per building code.' },
      { severity: 'info', message: 'Grand living room proportions (1:1.2) are ideal for acoustics.' },
      { severity: 'warning', message: 'Kitchen-to-dining flow is interrupted by load-bearing wall.' },
    ],
    chatHistory: [],
  },
  {
    id: 'demo-4',
    name: 'Compact Studio',
    timestamp: Date.now() - 3600000,
    svgContent: studioSvg,
    totalArea: 38.2,
    roomCount: 3,
    rooms: [
      { name: 'Living / Sleeping', area: 22.0 },
      { name: 'Kitchenette', area: 8.5 },
      { name: 'Bathroom', area: 7.7 },
    ],
    dqiScore: 58,
    qualityClass: 'Fair',
    suggestions: [
      { severity: 'critical', message: 'Total area below minimum habitable standard of 40 m² in some jurisdictions.' },
      { severity: 'warning', message: 'Kitchenette ventilation appears insufficient—add mechanical exhaust.' },
      { severity: 'warning', message: 'No defined storage area detected. Consider built-in closets.' },
      { severity: 'info', message: 'Bathroom placement is optimal for plumbing efficiency.' },
    ],
    chatHistory: [],
  },
];

export const DEMO_CHAT_RESPONSES: Record<string, string> = {
  default: "Based on my analysis of this floor plan, I can provide insights on room layouts, spatial efficiency, and design quality. What specific aspect would you like to explore?",
  room: "The room distribution in this plan shows a balanced allocation. The largest space serves as the primary living area, which is appropriate for the overall plan size.",
  improve: "Key improvements I'd recommend: 1) Optimize traffic flow between connected spaces, 2) Ensure each room has adequate natural light access, 3) Consider acoustic separation between quiet and active zones.",
  dqi: "The DQI (Design Quality Index) score reflects multiple factors: spatial efficiency, natural lighting, circulation quality, room proportions, and code compliance. A score above 80 indicates a well-designed plan.",
  area: "The total area calculation includes all enclosed spaces within the plan boundary. Each room's area is measured from interior wall surfaces.",
};
