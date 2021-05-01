import { setTimeout } from "timers";

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
