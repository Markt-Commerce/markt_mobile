/**
 * Wallet — balance, funding, transaction history and withdrawals.
 *
 * The wallet ledger already backed checkout ("pay from wallet"), seller
 * settlement and refunds, but the only thing the app ever read was the balance
 * on the checkout payment-method screen. This is the screen that actually
 * exposes it.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Plus, Wallet } from "lucide-react-native";
import { SettingsSection } from "../../components/SettingsList";
import { useTheme } from "../../components/themeProvider";
import { useToast } from "../../components/ToastProvider";
import { formatNaira } from "../../utils/formatCurrency";
import { friendlyErrorMessage } from "../../utils/errorMessages";
import {
  getWallet,
  getWalletTransactions,
  initializeWalletTopUp,
  requestWithdrawal,
  MIN_TOPUP_AMOUNT,
  MIN_WITHDRAWAL_AMOUNT,
  type WalletTransaction,
} from "../../services/sections/wallet";

const PER_PAGE = 20;

/** Ledger reference types are snake_case enum values; these are the labels. */
const REFERENCE_LABELS: Record<string, string> = {
  order_settlement: "Sale settled",
  order_refund: "Refund",
  order_payment: "Order payment",
  wallet_topup: "Wallet top-up",
  withdrawal: "Withdrawal",
  adjustment: "Adjustment",
};

function TransactionRow({
  tx,
  isDark,
}: {
  tx: WalletTransaction;
  isDark: boolean;
}) {
  const isCredit = tx.type === "credit";
  const label = REFERENCE_LABELS[tx.reference_type] ?? tx.reference_type;
  const date = tx.created_at ? new Date(tx.created_at) : null;

  return (
    <View
      className={`flex-row items-center px-6 py-4 border-b ${isDark ? "border-[#46464e]" : "border-border"}`}
    >
      <View
        className={`w-10 h-10 rounded items-center justify-center mr-3 ${isDark ? "bg-[#2f3132]" : "bg-surface"}`}
      >
        {isCredit ? (
          <ArrowDownLeft size={18} color="#178b1f" strokeWidth={1.8} />
        ) : (
          <ArrowUpRight size={18} color="#E94C2A" strokeWidth={1.8} />
        )}
      </View>
      <View className="flex-1 pr-3">
        <Text
          className={`font-semibold text-[15px] ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          className={`text-[12px] mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
          numberOfLines={1}
        >
          {tx.description ??
            (date ? date.toLocaleDateString() : tx.reference_id)}
        </Text>
      </View>
      <View className="items-end">
        <Text
          className={`font-bold text-[15px] ${isCredit ? "text-[#178b1f]" : isDark ? "text-[#f0f1f2]" : "text-black"}`}
        >
          {isCredit ? "+" : "−"}
          {formatNaira(tx.amount)}
        </Text>
        <Text className={`text-[11px] mt-0.5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
          {formatNaira(tx.balance_after)}
        </Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [startingTopUp, setStartingTopUp] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(
    async (opts: { refresh?: boolean } = {}) => {
      if (opts.refresh) setRefreshing(true);
      try {
        const [wallet, history] = await Promise.all([
          getWallet(),
          getWalletTransactions(1, PER_PAGE),
        ]);
        setBalance(wallet.available_balance);
        setCurrency(wallet.currency);
        setTransactions(history.transactions);
        setPage(1);
        setTotalPages(history.pagination.total_pages || 1);
      } catch (e) {
        if ((e as { status?: number })?.status !== 401) {
          show({
            variant: "error",
            title: "Could not load wallet",
            message: friendlyErrorMessage(e, "Pull down to try again."),
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [show]
  );

  // Re-read on focus so returning from the top-up webview shows the new
  // balance without the user having to pull to refresh.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || refreshing || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const history = await getWalletTransactions(next, PER_PAGE);
      const seen = new Set(transactions.map((t) => t.id));
      setTransactions((prev) => [
        ...prev,
        ...history.transactions.filter((t) => !seen.has(t.id)),
      ]);
      setPage(next);
      setTotalPages(history.pagination.total_pages || next);
    } catch {
      // Silent: the list already has content and the footer stops spinning.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, refreshing, page, totalPages, transactions]);

  const handleStartTopUp = async () => {
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT) {
      show({
        variant: "error",
        title: "Amount too low",
        message: `Minimum top-up is ${formatNaira(MIN_TOPUP_AMOUNT)}.`,
      });
      return;
    }
    setStartingTopUp(true);
    try {
      const init = await initializeWalletTopUp({ amount, platform: "mobile" });
      setTopUpOpen(false);
      setTopUpAmount("");
      router.push({
        pathname: "/wallet/topup",
        params: {
          authorization_url: init.authorization_url,
          topup_id: init.topup_id,
        },
      });
    } catch (e) {
      show({
        variant: "error",
        title: "Could not start top-up",
        message: friendlyErrorMessage(e, "Please try again."),
      });
    } finally {
      setStartingTopUp(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_AMOUNT) {
      show({
        variant: "error",
        title: "Amount too low",
        message: `Minimum withdrawal is ${formatNaira(MIN_WITHDRAWAL_AMOUNT)}.`,
      });
      return;
    }
    if (balance != null && amount > balance) {
      show({
        variant: "error",
        title: "Insufficient balance",
        message: `You have ${formatNaira(balance)} available.`,
      });
      return;
    }
    if (!bankCode.trim() || !accountNumber.trim() || !accountName.trim()) {
      show({
        variant: "error",
        title: "Missing bank details",
        message: "Bank code, account number and account name are all required.",
      });
      return;
    }
    setWithdrawing(true);
    try {
      await requestWithdrawal({
        amount,
        bank_code: bankCode.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });
      setWithdrawOpen(false);
      setWithdrawAmount("");
      show({
        variant: "success",
        title: "Withdrawal requested",
        message: "We're sending it to your bank. This can take a few minutes.",
      });
      load();
    } catch (e) {
      show({
        variant: "error",
        title: "Withdrawal failed",
        message: friendlyErrorMessage(e, "Please check your details and try again."),
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const canWithdraw = (balance ?? 0) >= MIN_WITHDRAWAL_AMOUNT;

  const inputClass = `h-14 rounded border px-4 text-[15px] mb-4 ${isDark ? "bg-[#1a1c1d] border-[#46464e] text-[#f0f1f2]" : "bg-white border-border text-black"}`;
  const placeholderColor = isDark ? "#6b6b73" : "#A1A1AA";

  // A wallet should feel like a wallet, not another settings list. The balance
  // sits on a coloured ground that runs to the top of the screen, the way
  // banking apps do it, and the list of activity reads underneath as an
  // ordinary grouped section -- same language as Settings and Profile.
  const header = useMemo(
    () => (
      <>
        <View className="bg-primary px-5 pb-7">
          <View className="flex-row items-center justify-between h-12">
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-[17px] font-bold">Wallet</Text>
            <TouchableOpacity
              onPress={() => setTopUpOpen(true)}
              className="flex-row items-center"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Add money to wallet"
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text className="text-white text-[14px] font-semibold ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mt-6">
            <Text className="text-white/70 text-[13px] font-medium">
              Available balance · {currency}
            </Text>
            {balance == null ? (
              <ActivityIndicator size="small" color="#FFFFFF" className="mt-3" />
            ) : (
              <Text className="text-white text-[38px] font-bold mt-1.5">
                {formatNaira(balance)}
              </Text>
            )}
          </View>

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => setTopUpOpen(true)}
              activeOpacity={0.85}
              className="flex-1 h-12 rounded-xl bg-white items-center justify-center flex-row"
              accessibilityRole="button"
              accessibilityLabel="Fund wallet"
            >
              <Plus size={17} color="#E94C2A" strokeWidth={2.4} />
              <Text className="text-primary font-bold text-[14px] ml-1.5">Fund</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setWithdrawOpen(true)}
              disabled={!canWithdraw}
              activeOpacity={0.85}
              className={`flex-1 h-12 rounded-xl items-center justify-center flex-row bg-white/20 ${
                canWithdraw ? "" : "opacity-50"
              }`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canWithdraw }}
              accessibilityLabel="Withdraw to bank account"
            >
              <ArrowUpRight size={17} color="#FFFFFF" strokeWidth={2.4} />
              <Text className="text-white font-bold text-[14px] ml-1.5">Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SettingsSection title="Activity" dark={isDark} />
      </>
    ),
    [balance, currency, isDark, canWithdraw, router]
  );

  return (
    <SafeAreaView
      className="flex-1 bg-primary"
      edges={["top", "left", "right"]}
    >

      <FlatList
        data={transactions}
        keyExtractor={(tx) => String(tx.id)}
        renderItem={({ item }) => <TransactionRow tx={item} isDark={isDark} />}
        ListHeaderComponent={header}
        className={isDark ? "bg-[#1a1c1d]" : "bg-white"}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshing={refreshing}
        onRefresh={() => load({ refresh: true })}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#E94C2A" />
            </View>
          ) : (
            <View className="h-10" />
          )
        }
        ListEmptyComponent={
          loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="small" color="#E94C2A" />
            </View>
          ) : (
            <View className="px-6 py-12 items-center">
              <Text
                className={`text-[15px] text-center ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}
              >
                No wallet activity yet. Fund your wallet to pay for orders
                instantly.
              </Text>
            </View>
          )
        }
      />

      {/* Fund */}
      <Modal
        visible={topUpOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTopUpOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className={`rounded-t-2xl p-6 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
            <Text className={`text-lg font-bold mb-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              Fund wallet
            </Text>
            <Text className={`text-[13px] mb-5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              Minimum {formatNaira(MIN_TOPUP_AMOUNT)}. You'll complete payment with
              Paystack.
            </Text>
            <TextInput
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="numeric"
              placeholder="Amount"
              placeholderTextColor={placeholderColor}
              className={inputClass}
              accessibilityLabel="Top-up amount"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setTopUpOpen(false)}
                className={`flex-1 h-14 rounded items-center justify-center border ${isDark ? "border-[#46464e]" : "border-border"}`}
                accessibilityRole="button"
              >
                <Text
                  className={`font-bold text-xs tracking-[2px] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartTopUp}
                disabled={startingTopUp}
                className="flex-1 h-14 rounded bg-primary items-center justify-center"
                accessibilityRole="button"
              >
                {startingTopUp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Withdraw */}
      <Modal
        visible={withdrawOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className={`rounded-t-2xl p-6 ${isDark ? "bg-[#1a1c1d]" : "bg-white"}`}>
            <Text className={`text-lg font-bold mb-1 ${isDark ? "text-[#f0f1f2]" : "text-black"}`}>
              Withdraw to bank
            </Text>
            <Text className={`text-[13px] mb-5 ${isDark ? "text-[#c6c5cf]" : "text-tertiary"}`}>
              Minimum {formatNaira(MIN_WITHDRAWAL_AMOUNT)}. Available{" "}
              {formatNaira(balance ?? 0)}.
            </Text>
            <TextInput
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              placeholder="Amount"
              placeholderTextColor={placeholderColor}
              className={inputClass}
              accessibilityLabel="Withdrawal amount"
            />
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              placeholder="Account number"
              placeholderTextColor={placeholderColor}
              className={inputClass}
              accessibilityLabel="Bank account number"
            />
            <TextInput
              value={bankCode}
              onChangeText={setBankCode}
              keyboardType="number-pad"
              placeholder="Bank code (e.g. 058)"
              placeholderTextColor={placeholderColor}
              className={inputClass}
              accessibilityLabel="Bank code"
            />
            <TextInput
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Account name"
              placeholderTextColor={placeholderColor}
              className={inputClass}
              accessibilityLabel="Bank account name"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setWithdrawOpen(false)}
                className={`flex-1 h-14 rounded items-center justify-center border ${isDark ? "border-[#46464e]" : "border-border"}`}
                accessibilityRole="button"
              >
                <Text
                  className={`font-bold text-xs tracking-[2px] uppercase ${isDark ? "text-[#f0f1f2]" : "text-black"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 h-14 rounded bg-primary items-center justify-center"
                accessibilityRole="button"
              >
                {withdrawing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-xs tracking-[2px] uppercase">
                    Withdraw
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
