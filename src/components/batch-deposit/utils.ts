import { BatchOperation } from "@/types";

type StepStatus =
  | "pending"
  | "wallet-pending"
  | "confirming"
  | "completed"
  | "failed";

interface BatchStepLite {
  chainId: number;
  type: "approval" | "deposit" | "withdraw";
  amount: string;
  status: StepStatus;
}

type FlowState = "idle" | "executing" | "completed" | "failed";

export function buildBatchOperationFromSteps(
  batchSteps: BatchStepLite[],
  batchFlowState: FlowState,
  currentStepIndex: number
): BatchOperation | null {
  if (!batchSteps || batchSteps.length === 0) return null;

  return {
    id: `batch-${Date.now()}`,
    deposits: [],
    status: (batchFlowState === "executing"
      ? "in_progress"
      : batchFlowState) as any,
    currentStep: currentStepIndex + 1,
    totalSteps: batchSteps.length,
    transactions: batchSteps.map((step) => ({
      chainId: step.chainId,
      type: step.type,
      status:
        step.status === "wallet-pending" || step.status === "confirming"
          ? ("in_progress" as const)
          : (step.status as any),
      amount: step.amount,
    })),
  } as BatchOperation;
}
