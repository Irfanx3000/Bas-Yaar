"use client";

import { useTranslation } from "react-i18next";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";

export function SubscriptionHeader() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Button variant="text" icon="arrow-left" onClick={() => router.back()} className="absolute top-1 left-0 !px-2 z-10" />
        <div className="text-center px-10 sm:px-12">
          <h1 className="text-h3 sm:text-h2 font-extrabold text-heading leading-tight">{t("subscription.screenTitle")}</h1>
          <p className="text-body text-sm mt-2">{t("subscription.screenSubtitle")}</p>
        </div>
      </div>
      
      <Card radius="xl" padding="none" elevation="none" className="bg-primary-light border-0 flex overflow-hidden">
        <div className="p-5 flex items-center gap-4">
          <div className="text-primary shrink-0 ml-2">
            <Icon name="gem" size={32} />
          </div>
          <div>
            <h3 className="font-bold text-primary-vivid text-md">{t("subscription.bannerHeading")}</h3>
            <p className="text-body text-sm mt-1 leading-snug">{t("subscription.bannerBody")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
