"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Input } from "@/src/components/ui/input";
import { useTranslations } from "next-intl";
import { ChildProfile } from "@Lexopia/shared-types";
import {
  deleteChildAction,
  updateNotificationSettingsAction,
  updateChildGeneralSettingsAction,
} from "@/src/lib/progress-service/server-actions";
import { useLocale } from "@/src/contexts/LocaleContext";
import { INTEREST_OPTIONS } from "@/src/lib/onboarding/constants";

const MAX_INTERESTS = 5;

interface ChildSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChild: ChildProfile | undefined;
  notificationToggle: boolean | undefined;
  setNotificationToggle: (value: boolean) => void;
  handleChildAdded: () => void;
}

type ChildSettingsModalPanelProps = Omit<
  ChildSettingsModalProps,
  "isOpen" | "selectedChild"
> & {
  selectedChild: ChildProfile;
};

function ChildSettingsModalPanel({
  onClose,
  selectedChild,
  notificationToggle,
  setNotificationToggle,
  handleChildAdded,
}: ChildSettingsModalPanelProps) {
  const t = useTranslations("ParentDashboard");
  const tOnboarding = useTranslations("Onboarding");
  const { isRTL } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [childName, setChildName] = useState(selectedChild.name || "");
  const [storiesPerWeek, setStoriesPerWeek] = useState(
    selectedChild.storiesPerWeek || 3,
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    selectedChild.interests || selectedChild.favoriteThemes || [],
  );

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((item) => item !== interest);
      }
      if (prev.length >= MAX_INTERESTS) {
        toast.error(tOnboarding("maxInterests"));
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const result = await updateNotificationSettingsAction(
        selectedChild.id,
        notificationToggle ?? false,
      );

      if (result.success) {
        setNotificationToggle(notificationToggle ?? false);
        toast.success(
          t("notificationSettings.savedSuccess") ||
            "Notification settings saved!",
        );
        onClose();
        router.refresh();
      } else {
        toast.error("Failed to save notification settings");
      }
    } catch (error) {
      toast.error("Failed to save notification settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    const trimmedName = childName.trim();
    if (!trimmedName) {
      toast.error(t("childSettings.childNamePlaceholder"));
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateChildGeneralSettingsAction({
        childId: selectedChild.id,
        name: trimmedName,
        storiesPerWeek,
        interests: selectedInterests,
      });

      if (result.success) {
        toast.success(
          t("childSettings.savedSuccess") ||
            "General settings saved successfully!",
        );
        onClose();
        router.refresh();
      } else {
        toast.error("Failed to save general settings");
      }
    } catch (error) {
      toast.error("Failed to save general settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChild = async () => {
    if (deleteConfirmText !== selectedChild.name) {
      toast.error("Child name does not match");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteChildAction(selectedChild.id);

      if (result.success) {
        toast.success(
          t("childSettings.deleteSuccess") || "Child deleted successfully",
        );
        setShowDeleteConfirm(false);
        setDeleteConfirmText("");
        handleChildAdded();
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1000);
      } else {
        toast.error("Failed to delete child");
      }
    } catch (error) {
      toast.error("Failed to delete child");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setNotificationToggle(selectedChild?.activateNotifications || false);
    setChildName(selectedChild?.name || "");
    setStoriesPerWeek(selectedChild?.storiesPerWeek || 3);
    setSelectedInterests(
      selectedChild?.interests || selectedChild?.favoriteThemes || [],
    );
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-medium text-foreground">
            {t("childSettings.title") || "Child Settings"}
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <TabsList className="grid w-full grid-cols-3 mb-2">
              <TabsTrigger value="general">
                {t("childSettings.generalTab") || "General"}
              </TabsTrigger>
              <TabsTrigger value="notifications">
                {t("childSettings.notificationsTab") || "Notifications"}
              </TabsTrigger>
              <TabsTrigger value="deleteChild" className="text-red-600">
                {t("childSettings.deleteChildTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("childSettings.childName") || "Child Name"}
                </label>
                <Input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder={
                    t("childSettings.childNamePlaceholder") ||
                    "Enter child's name"
                  }
                  className="w-full"
                />
              </div>

              {selectedChild.age != null && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("overview.age")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("overview.ageValue", { age: selectedChild.age })}
                    {selectedChild.ageGroupName
                      ? ` (${selectedChild.ageGroupName})`
                      : ""}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  {t("childSettings.favoriteThemes") || "Interests"}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {INTEREST_OPTIONS.map((interest) => (
                    <motion.button
                      key={interest}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleInterest(interest)}
                      className={`p-2 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedInterests.includes(interest)
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-primary/50"
                      }`}
                    >
                      <p
                        className={`font-medium text-center text-sm ${
                          selectedInterests.includes(interest)
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {tOnboarding(`interests.${interest}`)}
                      </p>
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {tOnboarding("interestsHint")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  {t("childSettings.storiesPerWeek") || "Stories Per Week"}
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((sessions) => (
                    <motion.button
                      key={sessions}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStoriesPerWeek(sessions)}
                      className={`p-2 rounded-lg border-2 transition-all cursor-pointer text-sm font-medium ${
                        storiesPerWeek === sessions
                          ? "border-primary bg-primary/10 shadow-md text-primary"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {sessions}
                    </motion.button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveGeneral} disabled={isSaving}>
                {isSaving
                  ? t("childSettings.saving") || "Saving..."
                  : t("childSettings.saveGeneral") || "Save Changes"}
              </Button>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                <div className="flex md:items-center flex-col md:flex-row md:justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {t("notificationSettings.enableReminders") ||
                        "Enable Reminders"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("notificationSettings.remindersDescription", {
                        childName: selectedChild?.name || "your child",
                      })}
                    </p>
                  </div>
                  <Switch
                    checked={notificationToggle}
                    onCheckedChange={setNotificationToggle}
                  />
                </div>
              </div>

              <div
                className={`p-4 rounded-lg text-sm ${
                  notificationToggle
                    ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                    : "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                }`}
              >
                {notificationToggle
                  ? `✓ ${t("notificationSettings.enabledStatus") || "Reminders are enabled"}`
                  : `✗ ${t("notificationSettings.disabledStatus") || "Reminders are disabled"}`}
              </div>

              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                {isSaving
                  ? t("notificationSettings.saving") || "Saving..."
                  : t("notificationSettings.save") || "Save Changes"}
              </Button>
            </TabsContent>

            <TabsContent value="deleteChild" className="space-y-6">
              <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      {t("childSettings.dangerZone") || "Danger Zone"}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {t("childSettings.dangerZoneDescription") ||
                        "These actions cannot be undone. Please proceed with caution."}
                    </p>
                  </div>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t("childSettings.deleteChild") || "Delete Child Profile"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("childSettings.deleteChildDescription", {
                      childName: selectedChild.name || "this child",
                    })}
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={
                      t("childSettings.confirmPlaceholder") || "Type child name"
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteChild}
                      disabled={isDeleting}
                    >
                      {isDeleting
                        ? t("childSettings.deleting") || "Deleting..."
                        : t("childSettings.confirmDelete") || "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                    >
                      {t("childSettings.cancel") || "Cancel"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <Button variant="outline" onClick={handleCancel}>
            {t("childSettings.close") || "Close"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ChildSettingsModal({
  isOpen,
  selectedChild,
  ...panelProps
}: ChildSettingsModalProps) {
  if (!isOpen || !selectedChild) return null;

  return (
    <ChildSettingsModalPanel
      key={selectedChild.id}
      selectedChild={selectedChild}
      {...panelProps}
    />
  );
}
