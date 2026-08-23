import { getAuth } from "firebase/auth";
import { app } from "./config";

export const auth = getAuth(app);