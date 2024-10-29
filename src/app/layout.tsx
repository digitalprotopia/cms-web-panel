"use client";

import "./globals.css";
import client from "@/components/apollo-client";
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material";
import { ApolloProvider } from "@apollo/client";
import { SnackbarProvider } from "notistack";
import tailwind from "@/../tailwind.config";
import { Roboto } from "next/font/google";
import { ReactNode } from "react";

const inter = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  subsets: ["cyrillic-ext", "latin"],
});

console.log(tailwind.theme);
const theme = createTheme({
  palette: {
    primary: {
      main: tailwind?.theme?.extend?.colors.cms?.primary,
      contrastText: "#ffffff",
    },
    secondary: {
      main: tailwind?.theme?.extend?.colors.cms?.secondary,
      contrastText: "#4B5A73",
    },
    tertiary: {
      main: tailwind?.theme?.extend?.colors.cms?.tertiary,
      contrastText: "#4B5A73",
    },
  },
});

export default function CMSLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ApolloProvider client={client}>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
              <SnackbarProvider maxSnack={3}>{children}</SnackbarProvider>
            </ThemeProvider>
          </StyledEngineProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
