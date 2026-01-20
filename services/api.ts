import { User } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = "http://localhost:8080/api";

const getUsers = async (): Promise<User[]> => {
  const response = await axios.get<User[]>(`${API_URL}/users`);
  return response.data;
};

export const useUsers = () =>
  useQuery<User[]>({ queryKey: ["users"], queryFn: getUsers });
