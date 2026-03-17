"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Wand2, FolderOpen, Shield, Globe, LogOut } from "lucide-react";
import { useMithrilAuth } from "@/components/Mithril/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProject } from "@/contexts/ProjectContext";
import { phrase, langPairList } from "@/utils/phrases";
import type { Language } from "@/components/Types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnUI/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnUI/DropdownMenu";
import { Button } from "@/components/shadcnUI/Button";
import { listProjects } from "@/components/Mithril/services/firestore";
import type { ProjectMetadata } from "@/components/Mithril/services/firestore";

export default function MithrilHeader() {
  const { user, logout, isAuthenticated, isAdmin } = useMithrilAuth();
  const { language, dictionary, setLanguageOverride } = useLanguage();
  const { currentProject, setCurrentProject } = useProject();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [openLanguageDialog, setOpenLanguageDialog] = useState(false);
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    if (currentProject?.name && pathname.startsWith('/mithril')) {
      document.title = `${currentProject.name} | Mithril`;
    } else {
      document.title = 'Mithril';
    }
  }, [currentProject?.name, pathname, searchParams]);

  const handleLanguageChange = (lang: Language) => {
    setLanguageOverride(lang);
    setOpenLanguageDialog(false);
  };

  async function handleProjectsDropdownOpen(open: boolean) {
    if (!open || !user) return;
    setProjectsLoading(true);
    try {
      const data = await listProjects({ id: user.id, role: user.role });
      setProjects(data);
    } catch {
      // ignore
    } finally {
      setProjectsLoading(false);
    }
  }

  function handleProjectSelect(project: ProjectMetadata) {
    setCurrentProject(project);
    const stage = project.currentStage || 1;
    router.push(`/mithril?project=${project.id}&stage=${stage}`);
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 z-20
                         bg-white dark:bg-gray-900
                         border-b border-gray-200 dark:border-gray-800
                         flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Wand2 size={18} className="text-[#DB2777] shrink-0" />
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">Mithril</span>
          </Link>
          <DropdownMenu onOpenChange={handleProjectsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                title={phrase(dictionary, "sidebar_projects", language) || "Projects"}
                className={`p-2 rounded-md transition-colors ${
                  pathname === '/projects' || pathname === '/'
                    ? "text-[#DB2777]"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <FolderOpen size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
              {projectsLoading ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
              ) : projects.length === 0 ? (
                <DropdownMenuItem disabled>No projects</DropdownMenuItem>
              ) : (
                projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="cursor-pointer"
                  >
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/projects" className="cursor-pointer w-full">
                  View all projects
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {currentProject?.name && pathname.startsWith('/mithril') && (
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[240px] hidden sm:block">
            {currentProject.name}
          </span>
        )}
        <div className="flex items-center gap-1">
          {isAuthenticated && user && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-2 hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
          )}
          <button
            onClick={() => setOpenLanguageDialog(true)}
            title={phrase(dictionary, "language", language) || "Language"}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Globe size={16} />
          </button>
          {isAdmin && (
            <Link
              href="/mithril/admin"
              title={phrase(dictionary, "sidebar_admin", language) || "Admin"}
              className={`p-2 rounded-md transition-colors ${
                pathname.startsWith('/mithril/admin')
                  ? "text-[#DB2777]"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Shield size={16} />
            </Link>
          )}
          {isAuthenticated && (
            <button
              onClick={() => logout()}
              title={phrase(dictionary, "logout", language) || "Logout"}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      <Dialog open={openLanguageDialog} onOpenChange={setOpenLanguageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{phrase(dictionary, "language", language) || "Language"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {langPairList.map((langPair) => (
              <Button
                key={langPair.code}
                variant={language === langPair.code ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleLanguageChange(langPair.code as Language)}
              >
                {langPair.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
