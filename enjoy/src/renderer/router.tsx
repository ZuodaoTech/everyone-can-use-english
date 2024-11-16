import { createHashRouter } from "react-router-dom";
import { Layout } from "@renderer/components";
import Conversations from "./pages/conversations";
import Conversation from "./pages/conversation";
import Vocabulary from "./pages/vocabulary";
import ErrorPage from "./pages/error-page";
import Landing from "./pages/landing";
import Audio from "./pages/audio";
import Video from "./pages/video";
import Audios from "./pages/audios";
import Videos from "./pages/videos";
import Stories from "./pages/stories";
import Story from "./pages/story";
import Documents from "./pages/documents";
import Document from "./pages/document";
import Profile from "./pages/profile";
import User from "./pages/user";
import Home from "./pages/home";
import Community from "./pages/community";
import StoryPreview from "./pages/story-preview";
import Notes from "./pages/notes";
import PronunciationAssessmentsIndex from "./pages/pronunciation-assessments/index";
import PronunciationAssessmentsNew from "./pages/pronunciation-assessments/new";
import Courses from "./pages/courses/index";
import Course from "./pages/courses/show";
import Chapter from "./pages/courses/chapter";
import Chats from "./pages/chats";
import { ProtectedPage } from "./pages/protected-page";

export default createHashRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/landing", element: <Landing /> },
      {
        index: true,
        element: (
          <ProtectedPage>
            <Home />
          </ProtectedPage>
        ),
      },
      {
        path: "/chats",
        element: (
          <ProtectedPage>
            <Chats />
          </ProtectedPage>
        ),
      },
      {
        path: "/courses",
        element: (
          <ProtectedPage>
            <Courses />
          </ProtectedPage>
        ),
      },
      {
        path: "/courses/:id",
        element: (
          <ProtectedPage>
            <Course />
          </ProtectedPage>
        ),
      },
      {
        path: "/courses/:id/chapters/:sequence",
        element: (
          <ProtectedPage>
            <Chapter />
          </ProtectedPage>
        ),
      },
      {
        path: "/community",
        element: (
          <ProtectedPage>
            <Community />
          </ProtectedPage>
        ),
      },
      {
        path: "/users/:id",
        element: (
          <ProtectedPage>
            <User />
          </ProtectedPage>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedPage>
            <Profile />
          </ProtectedPage>
        ),
      },
      {
        path: "/conversations",
        element: (
          <ProtectedPage>
            <Conversations />
          </ProtectedPage>
        ),
      },
      {
        path: "/conversations/:id",
        element: (
          <ProtectedPage>
            <Conversation />
          </ProtectedPage>
        ),
      },
      {
        path: "/pronunciation_assessments",
        element: (
          <ProtectedPage>
            <PronunciationAssessmentsIndex />
          </ProtectedPage>
        ),
      },
      {
        path: "/pronunciation_assessments/new",
        element: (
          <ProtectedPage>
            <PronunciationAssessmentsNew />
          </ProtectedPage>
        ),
      },
      {
        path: "/vocabulary",
        element: (
          <ProtectedPage>
            <Vocabulary />
          </ProtectedPage>
        ),
      },
      {
        path: "/audios",
        element: (
          <ProtectedPage>
            <Audios />
          </ProtectedPage>
        ),
      },
      {
        path: "/audios/:id",
        element: (
          <ProtectedPage>
            <Audio />
          </ProtectedPage>
        ),
      },
      {
        path: "/videos",
        element: (
          <ProtectedPage>
            <Videos />
          </ProtectedPage>
        ),
      },
      {
        path: "/videos/:id",
        element: (
          <ProtectedPage>
            <Video />
          </ProtectedPage>
        ),
      },
      {
        path: "/documents",
        element: (
          <ProtectedPage>
            <Documents />
          </ProtectedPage>
        ),
      },
      {
        path: "/documents/:id",
        element: (
          <ProtectedPage>
            <Document />
          </ProtectedPage>
        ),
      },
      {
        path: "/stories",
        element: (
          <ProtectedPage>
            <Stories />
          </ProtectedPage>
        ),
      },
      {
        path: "/stories/:id",
        element: (
          <ProtectedPage>
            <Story />
          </ProtectedPage>
        ),
      },
      {
        path: "/stories/preview/:uri",
        element: (
          <ProtectedPage>
            <StoryPreview />
          </ProtectedPage>
        ),
      },
      {
        path: "/notes",
        element: (
          <ProtectedPage>
            <Notes />
          </ProtectedPage>
        ),
      },
    ],
  },
]);
