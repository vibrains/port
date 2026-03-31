"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MultiSelect } from "@ndos/ui";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  company_id: string | null;
}

interface ProjectSelectorProps {
  selectedCompanyIds: string[];
  selectedProjectIds: string[];
  onProjectsChange: (projectIds: string[]) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ProjectSelector({
  selectedCompanyIds,
  selectedProjectIds,
  onProjectsChange,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const prevProjectIdsRef = useRef<string[]>([]);

  // Debounce the company IDs to avoid excessive API calls
  const debouncedCompanyIds = useDebounce(selectedCompanyIds, 300);

  const fetchProjects = useCallback(async (companyIds: string[]) => {
    if (companyIds.length === 0) {
      setProjects([]);
      return;
    }

    setLoading(true);
    try {
      const companyIdsParam = companyIds.join(",");
      const response = await fetch(
        `/api/projects?companyIds=${encodeURIComponent(companyIdsParam)}`
      );

      if (response.ok) {
        const data: Project[] = await response.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects");
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projects when debounced company IDs change
  useEffect(() => {
    fetchProjects(debouncedCompanyIds);
  }, [debouncedCompanyIds, fetchProjects]);

  // Prune selected projects when the available projects change
  useEffect(() => {
    const availableProjectIds = new Set(projects.map((p) => p.id));
    const validSelectedIds = selectedProjectIds.filter((id) =>
      availableProjectIds.has(id)
    );

    // Only update if there are projects to remove
    if (validSelectedIds.length !== selectedProjectIds.length) {
      onProjectsChange(validSelectedIds);
    }

    // Store current project IDs for comparison
    prevProjectIdsRef.current = projects.map((p) => p.id);
  }, [projects, selectedProjectIds, onProjectsChange]);

  // Don't render if no companies are selected
  if (selectedCompanyIds.length === 0) {
    return null;
  }

  const options = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const selectedSet = new Set(selectedProjectIds);

  const handleChange = (newSelected: Set<string>) => {
    onProjectsChange(Array.from(newSelected));
  };

  return (
    <div className="relative">
      {loading ? (
        <div className="flex h-10 w-full min-w-[200px] items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-10 w-full min-w-[200px] items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
          No projects found
        </div>
      ) : (
        <MultiSelect
          options={options}
          selected={selectedSet}
          onChange={handleChange}
          placeholder="Select projects"
          label="projects"
          searchPlaceholder="Search projects..."
        />
      )}
    </div>
  );
}
