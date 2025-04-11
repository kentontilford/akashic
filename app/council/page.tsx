"use client";

import { useLocalStorage } from "@/lib/use-local-storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Download } from "lucide-react";

const defaultRoles = [
  { id: "strategist", label: "Strategist", tone: "Clear, executive" },
  { id: "mirror", label: "Mirror", tone: "Reflective and blunt" },
  { id: "mystic", label: "Mystic", tone: "Symbolic, ethereal" },
  { id: "scribe", label: "Scribe", tone: "Orderly and observant" }
];

export default function CouncilPage() {
  const [roles, setRoles] = useLocalStorage("akashic.council", defaultRoles);

  const updateTone = (id: string, newTone: string) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, tone: newTone } : r)));
  };

  const handleExportAll = () => {
    const exportObj = {
      user: JSON.parse(localStorage.getItem("akashic.user") || "{}"),
      council: roles,
      scroll: JSON.parse(localStorage.getItem("akashic.scroll") || "{}"),
      rituals: JSON.parse(localStorage.getItem("akashic.rituals") || "{}"),
      memory: JSON.parse(localStorage.getItem("akashic.memory") || "[]"),
      graph: JSON.parse(localStorage.getItem("akashic.graph") || "{}")
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "akashic-profile.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-blue-900">
        <Sparkles className="w-5 h-5" />
        <h1 className="text-2xl font-bold tracking-tight">Customize Your Council</h1>
      </div>
      <ul className="space-y-4">
        {roles.map((role) => (
          <li key={role.id} className="border p-4 rounded bg-white">
            <h2 className="text-lg font-semibold text-blue-700">{role.label}</h2>
            <p className="text-sm text-gray-600">Tone & Persona</p>
            <Input
              value={role.tone}
              onChange={(e) => updateTone(role.id, e.target.value)}
              className="mt-2"
            />
          </li>
        ))}
      </ul>
      <div className="flex gap-4 justify-end">
        <Button onClick={handleExportAll} className="gap-2">
          <Download className="w-4 h-4" /> Export Full Profile
        </Button>
      </div>
    </div>
  );
}
