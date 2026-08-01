import { inject, type InjectionKey } from "vue";
import type { SessionFlow } from "./controller";

export const sessionFlowKey: InjectionKey<SessionFlow> = Symbol("session-flow");

export function useSessionFlow(): SessionFlow {
  const flow = inject(sessionFlowKey);
  if (!flow) throw new Error("Session flow must be used inside ProductShell");
  return flow;
}
