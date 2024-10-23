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
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["cyrillic-ext", "latin"],
});

const theme = createTheme({
  palette: {
    primary: {
      main: tailwind?.theme?.extend?.colors?.primary,
      contrastText: "#ffffff",
    },
    secondary: {
      main: tailwind?.theme?.extend?.colors?.secondary,
      contrastText: "#4B5A73",
    },
    tertiary: {
      main: tailwind?.theme?.extend?.colors?.tertiary,
      contrastText: "#4B5A73",
    },
  },
  variables: {
    leftPanel: {
      width: 250,
    },
    header: {
      height: 73,
    },
  },
});

export default function CMSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
