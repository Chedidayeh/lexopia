"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import {
  ParentUser,
  AgeGroup,
  RoleType,
  ChildProfile,
  User,
} from "@Lexopia/shared-types";
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import AddChildDialog from "./AddChildDialog";
import { Session } from "next-auth";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChildSidebarProps {
  session: Session;
  childProfiles: ChildProfile[];
  selectedChildId: string | undefined;
  onChildSelect: (childId: string) => void;
  onChildAdded: () => void;
  userRole: RoleType;
  parentData: User;
  maxChildProfiles?: number;
}

export default function ChildSidebar({
  session,
  childProfiles,
  selectedChildId,
  onChildSelect,
  onChildAdded,
  userRole,
  parentData,
  maxChildProfiles,
}: ChildSidebarProps) {
  const t = useTranslations("ParentDashboard");
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);

  const childLimitReached = maxChildProfiles !== undefined && childProfiles.length >= maxChildProfiles;

  return (
    <div className="flex flex-col items-start gap-4 w-full lg:w-auto">
      <div className="w-full lg:flex lg:flex-col lg:w-64 bg-card rounded-xl p-4 shadow-warm-lg border border-black/30 h-fit lg:sticky lg:top-8 gap-4">
        <div>
          <h3 className="font-heading text-sm lg:text-lg text-foreground mb-3 lg:mb-4 px-2">
            {t("yourChildren")}
          </h3>
        </div>

        <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 lg:space-y-2 pb-2 lg:pb-0">
          {childProfiles.map((profile) => (
            <button
              key={profile.childId}
              onClick={() => onChildSelect(profile.childId)}
              className={cn(
                "flex-shrink-0 lg:w-full flex lg:flex-row flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg transition-all",
                "hover:bg-muted active:scale-95 whitespace-nowrap lg:whitespace-normal",
                selectedChildId === profile.childId
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-muted",
              )}
            >
              <Avatar className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0">
                <AvatarImage
                  src={profile.child?.avatar || ""}
                  alt={profile.child?.name}
                />
                <AvatarFallback>
                  {profile.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 lg:flex lg:flex-col lg:text-left">
                <p className="font-medium text-xs lg:text-sm text-foreground">
                  {profile.name || t("unknown")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("stars", { count: profile.totalStars || 0 })}
                </p>
              </div>
              {selectedChildId === profile.childId && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
        {userRole === RoleType.PARENT && (
          <Button
            size={"sm"}
            variant="outline"
            className="w-full lg:w-auto"
            onClick={() => setAddChildDialogOpen(true)}
            disabled={childLimitReached}
          >
            <Plus className="h-4 w-4 mr-1" />
            {childLimitReached ? t("childLimitReached") : t("addChild")}
          </Button>
        )}
      </div>

      <AddChildDialog
        open={addChildDialogOpen}
        onOpenChange={setAddChildDialogOpen}
        parentData={parentData}
        onChildAdded={onChildAdded}
      />
    </div>
  );
}
