"use client";

/* Wallet — the app's WalletScreen, and the half of the mid-subscription flow
 * that was missing on the web.
 *
 * ── How money actually gets in here ─────────────────────────────────────────
 * Switching plans mid-term does NOT refund to a card. `subscription.service.js`
 * computes a prorated credit for the unused part of the current plan and shows
 * it on the order summary as "Unused Subscription Credit" — a NEGATIVE row in
 * `priceBreakdown`, which is why /subscription/plan renders a negative amount as
 * a credit rather than reading a field named for one.
 *
 * When that credit exceeds the new plan's whole price, the leftover cannot come
 * off the bill — there is no bill left. `activate()` deposits it here instead:
 *
 *     walletService.credit({ type: 'plan_switch_credit',
 *                            description: 'Unused credit from switching
 *                                          subscription plans' })
 *
 * and the next purchase auto-applies it as `walletApplied`. So the loop is
 * summary → wallet → next summary, and without this screen the middle step was
 * invisible: money left the visible flow and reappeared as a discount the user
 * had no way to check. That is the whole reason this page matters.
 *
 * That deposit is deliberately fire-and-forget on the backend ("non-fatal"), so
 * it can lag the subscription by a moment — `useFocusEffect` reloading on mount
 * is what makes it turn up.
 *
 * ── Contracts, read before writing ──────────────────────────────────────────
 *   useWallet → balance · stats · transactions · currentPage · totalPages
 *               isLoading · loadError · selectedTransaction · detailVisible
 *               isLoadingDetail · handlePageChange · handleSelectTransaction
 *               closeDetail · reload
 *   transaction → { _id, referenceId, status, type, amount, balanceAfter,
 *                   referral, payment, description, createdAt }
 *     `amount` is SIGNED paise: positive credit, negative debit. `formatCurrency`
 *     divides by 100 — the raw number is 20000 for ₹200.
 *   stats → { totalCredited, totalDebited, pendingCredits }  — note totalDebited,
 *     which the copy deck labels "Total Spent".
 */

import { useWallet } from "@/hooks/useWallet";
import { formatCurrency, formatDate } from "@/utils/format";
import { t } from "@/i18n";
import { Card, EmptyState, ErrorState, Icon, LoadingState, Modal, Pagination } from "@/components/ui";

/* Keyed on the model's own enum (walletTransaction.model.js), which is
   snake_case. Getting this wrong is silent: the row would fall back to printing
   the raw type string. */
const TYPE_META = {
  referral_reward: { labelKey: "wallet.types.referralReward", icon: "user-friends" },
  redemption: { labelKey: "wallet.types.redemption", icon: "shopping-bag" },
  adjustment: { labelKey: "wallet.types.adjustment", icon: "sliders-h" },
  plan_switch_credit: { labelKey: "wallet.types.planSwitchCredit", icon: "exchange-alt" },
};

const metaFor = (type) => TYPE_META[type] ?? { labelKey: type, icon: "exchange-alt" };

function StatTile({ label, value }) {
  return (
    <Card padding="sm" radius="md" className="min-w-0">
      <p className="truncate text-xs text-hint">{label}</p>
      <p className="mt-[2px] text-md font-bold text-heading">{formatCurrency(value)}</p>
    </Card>
  );
}

function TransactionRow({ transaction, onSelect }) {
  const isCredit = transaction.amount >= 0;
  const meta = metaFor(transaction.type);

  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className="flex w-full cursor-pointer items-center gap-3 border-b border-line-soft px-1 py-3 text-left last:border-b-0 hover:bg-canvas-top"
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
          isCredit ? "bg-success-light text-success" : "bg-danger/10 text-danger"
        }`}
      >
        <Icon name={meta.icon} size={14} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-md font-semibold text-heading">
          {t(meta.labelKey, { defaultValue: transaction.type })}
        </span>
        <span className="block truncate text-sm text-hint">
          {transaction.description || formatDate(transaction.createdAt)}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className={`block text-md font-bold ${isCredit ? "text-success" : "text-danger"}`}>
          {isCredit ? "+" : "-"}
          {formatCurrency(Math.abs(transaction.amount))}
        </span>
        <span className="block text-xs text-hint">{formatDate(transaction.createdAt)}</span>
      </span>
    </button>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2 last:border-b-0">
      <span className="shrink-0 text-sm text-hint">{label}</span>
      <span className="min-w-0 text-right text-md font-semibold break-words text-heading">{value}</span>
    </div>
  );
}

function TransactionDetail({ transaction, loading }) {
  if (loading || !transaction) return <LoadingState rows={2} />;

  const isCredit = transaction.amount >= 0;
  const sub = transaction.payment?.subscription;

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-line-soft pb-3">
        <div className="min-w-0">
          <p className="truncate text-md font-bold text-heading">
            {t(metaFor(transaction.type).labelKey, { defaultValue: transaction.type })}
          </p>
          <p className="text-sm text-hint">{formatDate(transaction.createdAt)}</p>
        </div>
        <p className={`shrink-0 text-h3 font-extrabold ${isCredit ? "text-success" : "text-danger"}`}>
          {isCredit ? "+" : "-"}
          {formatCurrency(Math.abs(transaction.amount))}
        </p>
      </div>

      <div className="mt-2">
        <DetailRow label={t("wallet.detail.referenceId")} value={transaction.referenceId} />
        <DetailRow label={t("wallet.detail.description")} value={transaction.description} />
        <DetailRow
          label={t("wallet.detail.status")}
          value={t(`wallet.status.${transaction.status}`, { defaultValue: transaction.status })}
        />
        <DetailRow
          label={t("wallet.detail.date")}
          value={formatDate(transaction.createdAt, { day: "numeric", month: "long", year: "numeric" })}
        />
        {/* A system-issued credit — a plan-switch refund or an admin adjustment —
            has no gateway payment attached, which is exactly how it is told apart
            from something the user actually paid for. */}
        <DetailRow
          label={t("wallet.detail.paymentMethod")}
          value={
            transaction.payment
              ? t("wallet.detail.paymentMethodRazorpay")
              : t("wallet.detail.paymentMethodSystem")
          }
        />
        <DetailRow
          label={t("wallet.detail.relatedSubscription")}
          value={sub ? `${sub.tier} (${sub.billingCycle})` : null}
        />
        <DetailRow
          label={t("wallet.detail.invoiceReference")}
          value={transaction.payment?.receipt || transaction.payment?.gatewayOrderId || null}
        />
      </div>
    </>
  );
}

export default function WalletPage() {
  const {
    balance,
    stats,
    transactions,
    currentPage,
    totalPages,
    isLoading,
    loadError,
    selectedTransaction,
    detailVisible,
    isLoadingDetail,
    handlePageChange,
    handleSelectTransaction,
    closeDetail,
    reload,
  } = useWallet();

  return (
    <div className="mx-auto max-w-4xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">{t("wallet.title")}</h1>
      </header>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={reload} />
      ) : (
        <>
          <div className="bg-gradient-primary rounded-lg p-5 text-on-primary shadow-md">
            <p className="flex items-center gap-2 text-md font-semibold">
              <Icon name="wallet" size={16} />
              {t("wallet.cardTitle")}
            </p>
            <p className="mt-2 text-h1 font-extrabold">{formatCurrency(balance)}</p>
            <p className="text-sm text-white/85">{t("wallet.availableBalance")}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile label={t("wallet.stats.balance")} value={balance} />
            <StatTile label={t("wallet.stats.totalCredited")} value={stats.totalCredited} />
            {/* stats.totalDebited, labelled "Total Spent" — the field and the
                label do not share a name. */}
            <StatTile label={t("wallet.stats.totalSpent")} value={stats.totalDebited} />
            <StatTile label={t("wallet.stats.pendingCredits")} value={stats.pendingCredits} />
          </div>

          <Card className="mt-3" radius="md">
            <p className="text-md font-bold text-heading">{t("wallet.info.heading")}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {[t("wallet.info.subscriptions"), t("wallet.info.futureMarketplace")].map((line) => (
                <li key={line} className="flex items-center gap-2 text-md text-body">
                  <Icon name="check-circle" size={14} className="shrink-0 text-success" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-hint">{t("wallet.info.expiryNote")}</p>
          </Card>

          <h2 className="mt-6 mb-1 text-lg font-bold text-heading">{t("wallet.activityHeading")}</h2>

          {transactions.length === 0 ? (
            <EmptyState icon="wallet" title={t("wallet.emptyTitle")} message={t("wallet.emptySubtitle")} />
          ) : (
            <Card padding="sm" radius="md">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                  onSelect={handleSelectTransaction}
                />
              ))}
            </Card>
          )}

          {totalPages > 1 ? (
            <Pagination className="mt-4" page={currentPage} totalPages={totalPages} onChange={handlePageChange} />
          ) : null}
        </>
      )}

      {/* The hook opens the sheet BEFORE the detail request resolves and falls
          back to the list row's own data if it fails, so this is never empty
          while it is open. */}
      <Modal open={detailVisible} onClose={closeDetail} title={t("wallet.detail.transactionType")}>
        <TransactionDetail transaction={selectedTransaction} loading={isLoadingDetail} />
      </Modal>
    </div>
  );
}
