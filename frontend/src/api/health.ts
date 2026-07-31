import { useQuery } from "@pinia/colada";
import { getHealth, type ApiError, type HealthSuccessV1 } from "./generated";
import { healthQueryKey } from "./queryKeys";

export { healthQueryKey };
export type HealthQueryData = HealthSuccessV1;
export type HealthQueryError = ApiError;

export function useHealthQuery() {
  return useQuery<HealthQueryData, HealthQueryError>({
    key: healthQueryKey,
    query: async () => {
      const result = await getHealth({ throwOnError: true });
      return result.data;
    },
  });
}
