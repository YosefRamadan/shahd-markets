import { queryOptions } from "@tanstack/react-query";
import { getCart } from "./cart.functions";

export const cartQueryOptions = queryOptions({
  queryKey: ["cart"],
  queryFn: () => getCart(),
  staleTime: 0,
});
