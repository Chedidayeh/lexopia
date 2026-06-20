"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import {
  Progress,
  Story,
  Challenge,
  ChallengeAttempt,
  ChallengeStatus,
} from "@Lexopia/shared-types";
import { useTranslations } from "next-intl";
import { getLanguageCode } from "@/src/lib/translation-utils";
import { useLocale } from "@/src/contexts/LocaleContext";
import type { ChallengeAnalytics } from "../_lib/challenge-analytics";
import {
  formatActionSubmission,
  formatAttemptSubmission,
  getCorrectAnswerDisplay,
  getLocalizedAnswerText,
} from "../_lib/challenge-attempt-display";

interface RiddlesStatsProps {
  childProgress: Progress[];
  stories: Story[];
  analytics: ChallengeAnalytics;
}

export default function RiddlesStats({
  childProgress,
  stories,
  analytics,
}: RiddlesStatsProps) {
  const t = useTranslations("ParentDashboard");
  const { locale } = useLocale();
  const langCode = getLanguageCode(locale);

  const storiesMap = useMemo(
    () => new Map(stories.map((story) => [story.id, story])),
    [stories],
  );

  const {
    localizedStats: sortedChallengeStats,
    aggregatedStats,
    challengeStats,
  } = analytics;

  const [selectedChallenge, setSelectedChallenge] = useState<{
    challengeId: string;
    storyId: string;
    challenge: Challenge | null;
    attempts: ChallengeAttempt[];
  } | null>(null);

  const {
    totalChallenges,
    solvedChallenges,
    successRate,
    avgAttemptsPerChallenge,
  } = aggregatedStats;

  const getLocalizedQuestion = (challenge: Challenge | null) => {
    if (!challenge) return null;
    const translation = challenge.translations?.find(
      (entry) => entry.languageCode === langCode,
    );
    return translation?.question || challenge.question || null;
  };

  const getLocalizedHints = (challenge: Challenge | null): string[] => {
    if (!challenge?.hints?.length) return [];
    return challenge.hints
      .sort((a, b) => a.order - b.order)
      .map((hint) => {
        const translation = hint.translations?.find(
          (entry) => entry.languageCode === langCode,
        );
        return translation?.text || hint.text || "";
      })
      .filter(Boolean);
  };

  const correctAnswerLabels = useMemo(
    () => ({
      na: t("riddleStatistics.na"),
      noCorrectAnswer: t("riddleStatistics.noCorrectAnswer"),
      trueLabel: t("riddleStatistics.true"),
      falseLabel: t("riddleStatistics.false"),
    }),
    [t],
  );

  const getChallengeAttempts = (challengeId: string): ChallengeAttempt[] => {
    const attemptsMap = new Map<string, ChallengeAttempt>();

    childProgress.forEach((progress) => {
      progress.gameSession?.challengeAttempts?.forEach((attempt) => {
        if (attempt.challengeId === challengeId) {
          attemptsMap.set(attempt.id, attempt);
        }
      });
    });

    return Array.from(attemptsMap.values()).sort(
      (a, b) => a.attemptNumber - b.attemptNumber,
    );
  };

  const getStatusColor = (status: ChallengeStatus): string => {
    switch (status) {
      case ChallengeStatus.SOLVED:
        return "bg-green-100 text-green-700";
      case ChallengeStatus.INCORRECT:
        return "bg-red-100 text-red-700";
      case ChallengeStatus.SKIPPED:
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: ChallengeStatus): string => {
    switch (status) {
      case ChallengeStatus.SOLVED:
        return t("riddleStatistics.status.solved");
      case ChallengeStatus.SKIPPED:
        return t("riddleStatistics.status.skipped");
      case ChallengeStatus.INCORRECT:
        return t("riddleStatistics.status.incorrect");
      default:
        return t("riddleStatistics.status.notAttempted");
    }
  };

  const getChallengeData = (
    storyId: string,
    challengeId: string,
  ): Challenge | null => {
    const story = storiesMap.get(storyId);
    if (!story) return null;

    if (story.chapters) {
      for (const chapter of story.chapters) {
        if (chapter.challenge?.id === challengeId) {
          return chapter.challenge;
        }
      }
    }

    return story.challenges?.find((challenge) => challenge.id === challengeId) ?? null;
  };

  const handleChallengeClick = (storyId: string, challengeId: string) => {
    setSelectedChallenge({
      challengeId,
      storyId,
      challenge: getChallengeData(storyId, challengeId),
      attempts: getChallengeAttempts(challengeId),
    });
  };

  const localizedHints = selectedChallenge?.challenge
    ? getLocalizedHints(selectedChallenge.challenge)
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-linear-to-br from-purple-200/20 to-indigo-200/20 border border-purple-200 dark:border-purple-200/50 p-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("riddleStatistics.stats.totalChallenges")}
          </p>
          <p className="text-3xl font-data font-bold text-purple-600">
            {totalChallenges}
          </p>
        </div>
        <div className="rounded-lg bg-linear-to-br from-green-200/20 to-emerald-200/20 border border-green-200 dark:border-green-200/50 p-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("riddleStatistics.stats.solved")}
          </p>
          <p className="text-3xl font-data font-bold text-green-600">
            {solvedChallenges}
          </p>
        </div>
        <div className="rounded-lg bg-linear-to-br from-blue-200/20 to-cyan-200/20 border border-blue-200 dark:border-blue-200/50 p-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("riddleStatistics.stats.successRate")}
          </p>
          <p className="text-3xl font-data font-bold text-blue-600">
            {successRate}%
          </p>
        </div>
        <div className="rounded-lg bg-linear-to-br from-orange-200/20 to-red-200/20 border border-orange-200 dark:border-orange-200/50 p-4">
          <p className="text-sm text-muted-foreground mb-1">
            {t("riddleStatistics.stats.avgAttempts")}
          </p>
          <p className="text-3xl font-data font-bold text-orange-600">
            {avgAttemptsPerChallenge}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-black/30 p-6 shadow-warm-lg overflow-x-auto">
        <h3 className="font-heading text-lg text-foreground mb-4">
          {t("riddleStatistics.stats.detailedTitle")}
        </h3>
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <span className="font-medium">{t("riddleStatistics.tipPrefix")}</span>{" "}
            {t("riddleStatistics.tip")}
          </p>
        </div>

        {challengeStats.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {t("riddleStatistics.noAttempts")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("riddleStatistics.tableHeaders.storyChapter")}
                </TableHead>
                <TableHead>{t("riddleStatistics.tableHeaders.status")}</TableHead>
                <TableHead>{t("riddleStatistics.tableHeaders.attempts")}</TableHead>
                <TableHead className="text-right">
                  {t("riddleStatistics.tableHeaders.successRate")}
                </TableHead>
                <TableHead className="text-right">
                  {t("riddleStatistics.tableHeaders.hintsUsed")}
                </TableHead>
                <TableHead className="text-right">
                  {t("riddleStatistics.tableHeaders.timeSec")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedChallengeStats.map((challenge) => (
                <TableRow
                  key={challenge.id}
                  onClick={() =>
                    handleChallengeClick(challenge.storyId, challenge.id)
                  }
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors duration-200"
                >
                  <TableCell className="font-medium">
                    {`${challenge.storyTitle} - ${t("riddleStatistics.chapter")} ${challenge.chapterIndex ?? "?"}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        challenge.status === ChallengeStatus.SOLVED
                          ? "default"
                          : challenge.status === ChallengeStatus.SKIPPED
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {getStatusLabel(challenge.status as ChallengeStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {challenge.totalAttempts}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {challenge.successRate}%
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {challenge.hintsUsed}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {challenge.timeSpentSeconds}s
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={!!selectedChallenge}
        onOpenChange={() => setSelectedChallenge(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedChallenge &&
                (() => {
                  const localizedStat = sortedChallengeStats.find(
                    (stat) => stat.id === selectedChallenge.challengeId,
                  );
                  return localizedStat
                    ? `${localizedStat.storyTitle} - ${t("riddleStatistics.chapter")} ${localizedStat.chapterIndex ?? "?"}`
                    : t("riddleStatistics.modal.title");
                })()}
            </DialogTitle>
            <DialogDescription>
              {t("riddleStatistics.modal.title")}
            </DialogDescription>
          </DialogHeader>

          {selectedChallenge?.challenge && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedChallenge.challenge.type}
                  </Badge>
                </div>
                <h3 className="font-medium text-lg">
                  {t("riddleStatistics.modal.questionLabel")}{" "}
                  {getLocalizedQuestion(selectedChallenge.challenge)}
                </h3>
              </div>

              <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {t("riddleStatistics.modal.correctAnswerLabel")}
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {getCorrectAnswerDisplay(
                    selectedChallenge.challenge,
                    langCode,
                    correctAnswerLabels,
                  )}
                </p>
              </div>

              {selectedChallenge.challenge.type === "SEQUENCING" &&
                selectedChallenge.challenge.answers &&
                selectedChallenge.challenge.answers.length > 0 && (
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      {t("riddleStatistics.modal.sequenceItemsLabel")}
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {t("riddleStatistics.modal.sequenceItemsHint")}
                    </p>
                    <div className="space-y-2">
                      {[...selectedChallenge.challenge.answers]
                        .sort(
                          (a, b) =>
                            (a.correctSequence ?? a.order ?? 0) -
                            (b.correctSequence ?? b.order ?? 0),
                        )
                        .map((answer, index) => (
                          <div
                            key={answer.id}
                            className="flex items-start gap-3 p-2 bg-white dark:bg-blue-900 rounded"
                          >
                            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm text-blue-900 dark:text-blue-100 pt-1">
                              {getLocalizedAnswerText(answer, langCode)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {selectedChallenge.challenge.type !== "SEQUENCING" &&
                selectedChallenge.challenge.answers &&
                selectedChallenge.challenge.answers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {t("riddleStatistics.modal.optionsLabel")}
                    </h4>
                    <div className="space-y-2">
                      {selectedChallenge.challenge.answers.map((answer) => (
                        <div key={answer.id} className="p-3 rounded-lg border">
                          <span>{getLocalizedAnswerText(answer, langCode)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {localizedHints.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">
                    {t("riddleStatistics.modal.hintsLabel")}
                  </h4>
                  <div className="space-y-2">
                    {localizedHints.map((hint, index) => (
                      <div key={index} className="p-2 px-4 border rounded-lg">
                        <p className="font-medium text-sm text-muted-foreground">
                          {t("riddleStatistics.modal.hintNumber", {
                            n: index + 1,
                          })}
                        </p>
                        <p className="text-sm mt-1">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedChallenge.attempts.length > 0 ? (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">
                    {t("riddleStatistics.modal.childAttemptsTitle")}
                  </h4>
                  <div className="space-y-4">
                    {selectedChallenge.attempts.map((attempt) => {
                      const submissionLabel = formatAttemptSubmission(
                        attempt,
                        selectedChallenge.challenge,
                        langCode,
                      );

                      return (
                      <div
                        key={attempt.id}
                        className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {t("riddleStatistics.modal.attempts", {
                                n: attempt.attemptNumber,
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(attempt.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(attempt.status as ChallengeStatus)}>
                            {attempt.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              {t("riddleStatistics.modal.hintsUsed")}
                            </p>
                            <p className="font-medium">{attempt.usedHints}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("riddleStatistics.modal.timeSpent")}
                            </p>
                            <p className="font-medium">
                              {attempt.timeSpentSeconds}s
                            </p>
                          </div>
                        </div>

                        {attempt.actions && attempt.actions.length > 0 && (
                          <div className="space-y-2 pt-2">
                            {attempt.actions.map((action) => {
                              const actionSubmission =
                                selectedChallenge.challenge
                                  ? formatActionSubmission(
                                      action,
                                      selectedChallenge.challenge,
                                      langCode,
                                    )
                                  : null;

                              return (
                              <div
                                key={action.id}
                                className="bg-white dark:bg-gray-950 p-2 rounded border text-sm space-y-1"
                              >
                                <p className="font-medium">
                                  {t("riddleStatistics.modal.attemptLabel", {
                                    n: action.attemptNumberAtAction,
                                  })}
                                </p>
                                {actionSubmission && (
                                  <p>
                                    {t("riddleStatistics.modal.selected")}{" "}
                                    {actionSubmission}
                                  </p>
                                )}
                                {action.isCorrect !== null &&
                                  action.isCorrect !== undefined && (
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                                        action.isCorrect
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {action.isCorrect
                                        ? t("riddleStatistics.action.correct")
                                        : t("riddleStatistics.action.incorrect")}
                                    </span>
                                  )}
                              </div>
                              );
                            })}
                          </div>
                        )}

                        {submissionLabel && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              {t("riddleStatistics.modal.finalAnswerLabel")}
                            </p>
                            <p className="font-medium">{submissionLabel}</p>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-100">
                    {t("riddleStatistics.modal.noAttemptsRecorded")}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
