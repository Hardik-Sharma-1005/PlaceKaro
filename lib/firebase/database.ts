import { getDatabase } from "firebase/database";
import { app } from "./config";

export const database = getDatabase(
  app,
  "https://placekaro-default-rtdb.asia-southeast1.firebasedatabase.app"
);
