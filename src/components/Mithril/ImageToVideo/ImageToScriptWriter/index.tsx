"use client";

import { useState, useMemo } from "react";
import { Loader2, Sparkles, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useMithril } from "../../MithrilContext";
import type { MangaPage } from "../ImageSplitter";

// Genre presets
interface GenrePreset {
  id: string;
  name: string;
  description: string;
  story: string;
  image: string;
  video: string;
  sound: string;
}

const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Epic fantasy with magic and adventure',
    story: `1. Faithfully reflect the original text content while enhancing visual narrative for animation.
2. Ensure smooth scene transitions.
3. Maintain short clips (1-2 seconds) for dynamic pacing.`,
    image: `1. Maintain consistent character appearances (hair color, clothing, etc.).
2. Match shot angles with background ID guidelines.
3. Reflect the time period and atmosphere accurately.`,
    video: `1. Keep camera angles and movements concise.
2. When characters speak, include speaking animation description.
3. Use pronouns instead of character names.`,
    sound: `1. Categorize into dialogue, sound effects, and background music.
2. If manga panel has text, prioritize using it as dialogue.
3. Leave dialogue field empty for scenes without speech.`,
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Emotional romance and drama',
    story: `1. Focus on emotional beats and character expressions.
2. Include internal monologue where appropriate.
3. Emphasize meaningful glances and subtle gestures.`,
    image: `1. Soft, warm color palette for romantic moments.
2. Detailed facial expressions and body language.
3. Atmospheric lighting to enhance mood.`,
    video: `1. Slower pacing for emotional scenes.
2. Close-ups on character faces during key moments.
3. Smooth camera movements.`,
    sound: `1. Emotional background music selection.
2. Heartbeat effects for tense romantic moments.
3. Soft ambient sounds for intimate scenes.`,
  },
  {
    id: 'action',
    name: 'Action',
    description: 'Fast-paced action and battle scenes',
    story: `1. Emphasize impact and movement.
2. Break down complex actions into clear sequences.
3. Build tension through pacing.`,
    image: `1. Dynamic poses and angles.
2. Motion blur and impact effects.
3. Bold, contrasting colors for intensity.`,
    video: `1. Quick cuts for action sequences.
2. Emphasize speed lines and motion.
3. Impactful camera shakes.`,
    sound: `1. Punchy sound effects for impacts.
2. High-energy background music.
3. Character battle cries and reactions.`,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Define your own conditions',
    story: '',
    image: '',
    video: '',
    sound: '',
  },
];

export default function ImageToScriptWriter() {
  const { getStageResult, setStageResult } = useMithril();

  // Get panels from Stage 1
  const stage1Result = getStageResult(1) as { pages: MangaPage[] } | undefined;
  const pages = stage1Result?.pages || [];
  const totalPanels = pages.reduce((acc, p) => acc + p.panels.length, 0);

  // State
  const [selectedGenre, setSelectedGenre] = useState<string>('fantasy');
  const [targetDuration, setTargetDuration] = useState('03:00');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  // Conditions (editable)
  const [storyCondition, setStoryCondition] = useState(GENRE_PRESETS[0].story);
  const [imageCondition, setImageCondition] = useState(GENRE_PRESETS[0].image);
  const [videoCondition, setVideoCondition] = useState(GENRE_PRESETS[0].video);
  const [soundCondition, setSoundCondition] = useState(GENRE_PRESETS[0].sound);

  // Generated storyboard
  const [scenes, setScenes] = useState<any[]>([]);
  const [voicePrompts, setVoicePrompts] = useState<any[]>([]);

  // Handle genre change
  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    const preset = GENRE_PRESETS.find(p => p.id === genreId);
    if (preset && genreId !== 'custom') {
      setStoryCondition(preset.story);
      setImageCondition(preset.image);
      setVideoCondition(preset.video);
      setSoundCondition(preset.sound);
    }
  };

  // Collect all panels with images from pages
  const allPanels = useMemo(() => {
    const panels: { id: string; imageBase64: string; label: string }[] = [];
    pages.forEach(page => {
      page.panels.forEach(panel => {
        if (panel.imageUrl) {
          panels.push({
            id: panel.id,
            imageBase64: panel.imageUrl,
            label: panel.label || `Panel ${panels.length + 1}`,
          });
        }
      });
    });
    return panels;
  }, [pages]);

  // Generate storyboard
  const handleGenerate = async () => {
    if (totalPanels === 0) {
      alert('Please complete Stage 1 (Panel Splitter) first');
      return;
    }

    if (allPanels.length === 0) {
      alert('No panel images available. Please re-process the panels in Stage 1.');
      return;
    }

    setIsGenerating(true);

    try {
      // Call API to generate storyboard
      const response = await fetch('/api/manga/generate-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panels: allPanels,
          sourceText: sourceText || undefined,
          targetDuration,
          storyCondition,
          imageCondition,
          videoCondition,
          soundCondition,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate storyboard');
      }

      const data = await response.json();
      const generatedScenes = data.scenes || [];
      const generatedVoicePrompts = data.voicePrompts || [];

      setScenes(generatedScenes);
      setVoicePrompts(generatedVoicePrompts);

      // Save to stage results
      setStageResult(2, { scenes: generatedScenes, voicePrompts: generatedVoicePrompts });
    } catch (error) {
      console.error('Error generating storyboard:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate storyboard');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (scenes.length === 0) return;

    const headers = [
      'Scene', 'Clip', 'Length', 'Accumulated Time', 'Story',
      'Image Prompt', 'Video Prompt', 'Dialogue (Ko)', 'Dialogue (En)',
      'SFX (Ko)', 'SFX (En)', 'BGM (Ko)', 'BGM (En)'
    ];

    const rows = scenes.flatMap((scene, sIdx) =>
      scene.clips.map((clip: any, cIdx: number) => [
        `Scene ${sIdx + 1}: ${scene.sceneTitle}`,
        `${sIdx + 1}-${cIdx + 1}`,
        clip.length,
        clip.accumulatedTime,
        clip.story,
        clip.imagePrompt,
        clip.videoPrompt,
        clip.dialogue,
        clip.dialogueEn,
        clip.sfx,
        clip.sfxEn,
        clip.bgm,
        clip.bgmEn,
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`)
    ));

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Image to Script Writer</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Generate animation storyboard from manga panels
        </p>
      </div>

      {/* Panels Summary */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Panels from Stage 1</p>
            <p className="text-2xl font-bold text-[#DB2777]">{totalPanels} panels</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pages</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{pages.length}</p>
          </div>
        </div>
        {totalPanels === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            Please complete the Panel Splitter stage first
          </p>
        )}
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target Duration (MM:SS)
          </label>
          <input
            type="text"
            value={targetDuration}
            onChange={(e) => setTargetDuration(e.target.value)}
            placeholder="03:00"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Genre Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Genre Preset
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {GENRE_PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name} - {preset.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Source Text (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Source Text (Optional)
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste original story text here for better context..."
          rows={4}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Conditions (Collapsible) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
          onClick={() => setShowConditions(!showConditions)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Generation Conditions (Advanced)
          </span>
          {showConditions ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showConditions && (
          <div className="p-4 pt-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Story Condition
              </label>
              <textarea
                value={storyCondition}
                onChange={(e) => setStoryCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Image Condition
              </label>
              <textarea
                value={imageCondition}
                onChange={(e) => setImageCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Video Condition
              </label>
              <textarea
                value={videoCondition}
                onChange={(e) => setVideoCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Sound Condition
              </label>
              <textarea
                value={soundCondition}
                onChange={(e) => setSoundCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || totalPanels === 0}
          className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Storyboard...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Storyboard
            </>
          )}
        </button>

        {scenes.length > 0 && (
          <button
            onClick={exportCSV}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Results */}
      {scenes.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 border-b border-gray-200 dark:border-gray-600">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">
              Generated Storyboard ({scenes.reduce((acc, s) => acc + s.clips.length, 0)} clips)
            </h3>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Scene</th>
                  <th className="p-2 text-left">Story</th>
                  <th className="p-2 text-left">Image Prompt</th>
                  <th className="p-2 text-left">Length</th>
                </tr>
              </thead>
              <tbody>
                {scenes.flatMap((scene, sIdx) =>
                  scene.clips.map((clip: any, cIdx: number) => (
                    <tr key={`${sIdx}-${cIdx}`} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-2 text-gray-600 dark:text-gray-400">
                        {cIdx === 0 ? scene.sceneTitle : ''}
                      </td>
                      <td className="p-2 text-gray-800 dark:text-gray-200">{clip.story}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {clip.imagePrompt}
                      </td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">{clip.length}s</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
