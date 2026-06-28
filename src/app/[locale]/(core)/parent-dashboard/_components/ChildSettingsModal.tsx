"use client";



import { useState, useEffect } from "react";

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

import {

  NameStep,

  BirthDateStep,

  GenderStep,

  LanguageStep,

  ReadingLevelStep,

  ChallengesStep,

  InterestsStep,

  CharacterTypeStep,

  StoryToneStep,

  StoriesPerWeekStep,

  NotificationsStep,

} from "@/src/lib/onboarding/element-steps";

import {

  getPlanConstraints,

  type PlanConstraints,

} from "@/src/lib/onboarding/plan-constraints";

import { SubscriptionPlan } from "@/src/types/types";

import {

  INITIAL_ONBOARDING_FORM,

  type OnboardingFormState,

  validateStep2,

  validateStep3WithPlan,

  validateStep4WithPlan,

  validateStep5WithPlan,

  calculateAgeFromDate,

} from "@/src/lib/onboarding/schemas";



const MAX_INTERESTS = 5;



interface ChildSettingsModalProps {

  isOpen: boolean;

  onClose: () => void;

  selectedChild: ChildProfile | undefined;

  notificationToggle: boolean | undefined;

  setNotificationToggle: (value: boolean) => void;

  handleChildAdded: () => void;

  parentSubscriptionPlan?: SubscriptionPlan;

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

  parentSubscriptionPlan,

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



  // Plan constraints

  const [planConstraints, setPlanConstraints] = useState<PlanConstraints>(

    getPlanConstraints(parentSubscriptionPlan || SubscriptionPlan.FREE)

  );



  // Onboarding form state

  const [form, setForm] = useState<OnboardingFormState>({

    ...INITIAL_ONBOARDING_FORM,

    name: selectedChild.name || "",

    birthDate: selectedChild.birthDate ? new Date(selectedChild.birthDate) : null,

    gender: selectedChild.gender || "",

    primaryLanguage: (selectedChild.primaryLanguage as any) || "EN",

    readingLevel: (selectedChild.readingLevel as any) || "BEGINNER",

    assignedChallenges: selectedChild.assignedChallenges || [],

    interests: selectedChild.interests || selectedChild.favoriteThemes || [],

    favoriteCharacterType: selectedChild.favoriteCharacterType || "",

    storyTone: selectedChild.storyTone || "",

    storiesPerWeek: selectedChild.storiesPerWeek || 1,

    sessionDurationMins: selectedChild.sessionDurationMins || 10,

    activateNotifications: selectedChild.activateNotifications || false,

  });



  const updateForm = <K extends keyof OnboardingFormState>(

    key: K,

    value: OnboardingFormState[K],

  ) => {

    setForm((prev) => ({ ...prev, [key]: value }));

  };



  const toggleArrayItem = (key: "interests" | "assignedChallenges", value: string) => {

    setForm((prev) => {

      const current = prev[key];

      const next = current.includes(value)

        ? current.filter((v) => v !== value)

        : [...current, value];

      return { ...prev, [key]: next };

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

    // Validate name

    if (!form.name || form.name.trim().length === 0) {

      toast.error(tOnboarding("childNameRequired"));

      return;

    }



    // Validate birth date

    if (form.birthDate) {

      const age = calculateAgeFromDate(form.birthDate);

      if (age < 3 || age > 12) {

        toast.error(tOnboarding("invalidAge"));

        return;

      }

    }



    // Validate gender

    if (!form.gender) {

      toast.error(tOnboarding("selectGender"));

      return;

    }



    // Validate language

    if (!form.primaryLanguage) {

      toast.error(tOnboarding("selectLanguageRequired"));

      return;

    }



    // Validate reading level

    if (!form.readingLevel) {

      toast.error(tOnboarding("selectReadingLevel"));

      return;

    }



    // Validate challenges with plan constraints

    const challengeValidation = validateStep3WithPlan(

      {

        primaryLanguage: form.primaryLanguage,

        readingLevel: form.readingLevel,

        assignedChallenges: form.assignedChallenges,

      },

      planConstraints

    );

    if (!challengeValidation.valid) {

      toast.error(tOnboarding(challengeValidation.message));

      return;

    }



    // Validate interests with plan constraints

    if (form.interests.length === 0) {

      toast.error(tOnboarding("selectAtLeastOneTheme"));

      return;

    }

    const maxThemes = planConstraints?.maxThemes ?? 5;

    if (form.interests.length > maxThemes) {

      toast.error(tOnboarding("maxInterests"));

      return;

    }



    // Validate character type

    if (!form.favoriteCharacterType) {

      toast.error(tOnboarding("selectCharacterType"));

      return;

    }



    // Validate story tone

    if (!form.storyTone) {

      toast.error(tOnboarding("selectStoryTone"));

      return;

    }



    // Validate stories per week with plan constraints

    const storiesValidation = validateStep5WithPlan(

      {

        storiesPerWeek: form.storiesPerWeek,

        sessionDurationMins: form.sessionDurationMins,

        activateNotifications: form.activateNotifications,

      },

      planConstraints

    );

    if (!storiesValidation.valid) {

      toast.error(tOnboarding(storiesValidation.message));

      return;

    }



    setIsSaving(true);

    try {

      const result = await updateChildGeneralSettingsAction({

        childId: selectedChild.id,

        name: form.name.trim(),

        birthDate: form.birthDate,

        gender: form.gender,

        primaryLanguage: form.primaryLanguage,

        readingLevel: form.readingLevel,

        assignedChallenges: form.assignedChallenges,

        interests: form.interests,

        favoriteCharacterType: form.favoriteCharacterType,

        storyTone: form.storyTone,

        storiesPerWeek: form.storiesPerWeek,

        sessionDurationMins: form.sessionDurationMins,

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

    setForm({

      ...INITIAL_ONBOARDING_FORM,

      name: selectedChild?.name || "",

      birthDate: selectedChild?.birthDate ? new Date(selectedChild.birthDate) : null,

      gender: selectedChild?.gender || "",

      primaryLanguage: (selectedChild?.primaryLanguage as any) || "EN",

      readingLevel: (selectedChild?.readingLevel as any) || "BEGINNER",

      assignedChallenges: selectedChild?.assignedChallenges || [],

      interests: selectedChild?.interests || selectedChild?.favoriteThemes || [],

      favoriteCharacterType: selectedChild?.favoriteCharacterType || "",

      storyTone: selectedChild?.storyTone || "",

      storiesPerWeek: selectedChild?.storiesPerWeek || 1,

      sessionDurationMins: selectedChild?.sessionDurationMins || 10,

      activateNotifications: selectedChild?.activateNotifications || false,

    });

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

            <TabsList className="grid w-full grid-cols-4 mb-2">

              <TabsTrigger value="general">

                {t("childSettings.generalTab") || "General"}

              </TabsTrigger>

              <TabsTrigger value="reading">

                {t("childSettings.readingTab") || "Reading"}

              </TabsTrigger>

              <TabsTrigger value="notifications">

                {t("childSettings.notificationsTab") || "Notifications"}

              </TabsTrigger>

              <TabsTrigger value="deleteChild" className="text-red-600">

                {t("childSettings.deleteChildTab")}

              </TabsTrigger>

            </TabsList>



            <TabsContent value="general" className="space-y-4">

              <NameStep t={tOnboarding} form={form} updateForm={updateForm} />

              <BirthDateStep t={tOnboarding} form={form} updateForm={updateForm} />

              <GenderStep t={tOnboarding} form={form} updateForm={updateForm} />

              <LanguageStep t={tOnboarding} form={form} updateForm={updateForm} />

              <ReadingLevelStep t={tOnboarding} form={form} updateForm={updateForm} />

              <Button onClick={handleSaveGeneral} disabled={isSaving}>

                {isSaving

                  ? t("childSettings.saving") || "Saving..."

                  : t("childSettings.saveGeneral") || "Save Changes"}

              </Button>

            </TabsContent>



            <TabsContent value="reading" className="space-y-4">

              <ChallengesStep

                t={tOnboarding}

                form={form}

                updateForm={updateForm}

                toggleChallenge={toggleArrayItem}

                planConstraints={planConstraints}

              />

              <InterestsStep

                t={tOnboarding}

                form={form}

                updateForm={updateForm}

                toggleInterest={toggleArrayItem}

                planConstraints={planConstraints}

              />

              <CharacterTypeStep t={tOnboarding} form={form} updateForm={updateForm} />

              <StoryToneStep t={tOnboarding} form={form} updateForm={updateForm} />

              <StoriesPerWeekStep

                t={tOnboarding}

                form={form}

                updateForm={updateForm}

                planConstraints={planConstraints}

              />

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

                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />

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

