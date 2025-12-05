import { createConfig } from "ponder";

import { FeyAbi } from "./abis/FeyAbi";

export default createConfig({
  // database: {
  //   kind: "postgres",
  //   connectionString: process.env.DATABASE_URL!,
  // },
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_8453!,
    },
  },
  contracts: {
    Fey: {
      chain: "base",
      abi: FeyAbi,
      address: "0x8EEF0dC80ADf57908bB1be0236c2a72a7e379C2d",
      startBlock: parseInt(process.env.START_BLOCK || "0"),
    },
  },
});
