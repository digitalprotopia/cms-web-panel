"use client";

import { useSnackbar } from "notistack";
import { gql, useMutation } from "@apollo/client";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import config from "@/config/config";

const SIGN_IN = gql`
  mutation ($password: String!, $email: String, $name: String) {
    signIn(email: $email, name: $name, password: $password)
  }
`;

export default function Page(props) {
  const router = useRouter();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signIn] = useMutation(SIGN_IN);
  const { enqueueSnackbar } = useSnackbar();

  if (props?.user?.domains.length > 0) {
    router.push(`/domains/${props.user.domains[0].id}`);
  }

  if (props?.user?.domains.length === 0) {
    if (config.demo) router.push("/");
    else router.push("/welcomePage");
  }

  return (
    <div className="size-full flex items-center justify-center p-4">
      <div className="flex flex-col justify-between items-center bg-white rounded p-5 shadow-lg w-full max-w-md mx-auto">
        <span className="text-2xl font-medium">Вход</span>
        <div className="flex flex-col mt-2 w-full">
          <TextField
            margin="normal"
            label="E-Mail"
            type="email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
          />
          <TextField
            margin="normal"
            label="Пароль"
            type="password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />
          <Button
            variant="contained"
            className="mt-2"
            disabled={!loginForm.email || !loginForm.password}
            onClick={async () => {
              try {
                await signIn({
                  variables: { ...loginForm },
                  onCompleted: async (data) => {
                    enqueueSnackbar("Вы вошли", { variant: "success" });
                    localStorage.setItem("token", data.signIn);
                    props.refetchUser();
                  },
                });
              } catch (e) {
                enqueueSnackbar(e.message, { variant: "error" });
              }
            }}
          >
            Войти
          </Button>
          <div className="flex justify-between items-center text-base pt-3.5">
            <Link
              href="restore-password/request"
              className="text-black/60 no-underline"
            >
              Забыли пароль?
            </Link>
            <Link href="register" className="no-underline">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
