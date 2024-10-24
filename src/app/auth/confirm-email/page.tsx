import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useEffect } from "react";

const CONFIRM_EMAIL = gql`
  mutation ($code: ID!) {
    confirmEmail(code: $code)
  }
`;

function ConfirmEmail() {
  const { enqueueSnackbar } = useSnackbar();

  const router = useRouter();

  const [confirmEmail] = useMutation(CONFIRM_EMAIL);

  const code = new URLSearchParams(window.location.search).get("code");

  useEffect(() => {
    if (!code) {
      enqueueSnackbar("Неверный код подтверждения email", { variant: "error" });
      return;
    }
    (async () => {
      const { data } = await confirmEmail({
        variables: { code },
      });

      if (data.confirmEmail) {
        enqueueSnackbar("Email успешно подтвержден", { variant: "success" });
        router.push("/");
      } else {
        enqueueSnackbar("Ошибка подтверждения email", { variant: "error" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div />;
}

export default ConfirmEmail;
