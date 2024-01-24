import { t } from "i18next";
import { useState, useContext, useEffect } from "react";
import { Button, Progress } from "@renderer/components/ui";
import { Link } from "react-router-dom";
import {
  LoginForm,
  ChooseLibraryPathInput,
  WhisperModelOptionsPanel,
} from "@renderer/components";
import { AppSettingsProviderContext } from "@renderer/context";
import { CheckCircle2Icon } from "lucide-react";

export default () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [currentStepValid, setCurrentStepValid] = useState<boolean>(false);

  const { user, libraryPath, whisperConfig, initialized } = useContext(
    AppSettingsProviderContext
  );
  const totalSteps = 4;

  useEffect(() => {
    validateCurrentStep();
  }, [currentStep, user, whisperConfig]);

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        setCurrentStepValid(!!user);
        break;
      case 2:
        setCurrentStepValid(!!libraryPath);
        break;
      case 3:
        setCurrentStepValid(Boolean(whisperConfig.model));
        break;
      case 4:
        setCurrentStepValid(initialized);
        break;
      default:
        setCurrentStepValid(false);
    }
  };

  const nextStep = () => {
    if (currentStepValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepTitles: any = {
    1: {
      title: t("login"),
      subtitle: t("loginBeforeYouStart"),
    },
    2: {
      title: t("libraryPath"),
      subtitle: t("whereYourResourcesAreStored"),
    },
    3: {
      title: t("AIModel"),
      subtitle: t("chooseAIModelToDownload"),
    },
    4: {
      title: t("finish"),
      subtitle: t("youAreReadyToGo"),
    },
  };

  return (
    <div className="h-screen w-full px-4 py-6 lg:px-8 flex flex-col">
      <div className="text-center">
        <div className="text-lg font-mono py-6">
          {t("nthStep", { current: currentStep, totalSteps })}:{" "}
          {stepTitles[currentStep].title}
        </div>
        <div className="text-sm opacity-70">
          {stepTitles[currentStep].subtitle}
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center">
        {currentStep == 1 && <LoginForm />}
        {currentStep == 2 && <ChooseLibraryPathInput />}
        {currentStep == 3 && <WhisperModelOptionsPanel />}
        {currentStep == 4 && (
          <div className="flex justify-center items-center">
            <CheckCircle2Icon className="text-green-500 w-24 h-24" />
          </div>
        )}
      </div>
      <div className="mt-auto">
        <div className="flex mb-4 justify-end space-x-4">
          {currentStep > 1 && (
            <Button className="w-24" variant="ghost" onClick={prevStep}>
              {t("previousStep")}
            </Button>
          )}
          {totalSteps == currentStep ? (
            <Link to="/" replace>
              <Button className="w-24">{t("finish")}</Button>
            </Link>
          ) : (
            <Button
              disabled={!currentStepValid}
              className="w-24"
              onClick={nextStep}
            >
              {t("nextStep")}
            </Button>
          )}
        </div>
        <div className="mb-4">
          <Progress value={(currentStep / totalSteps) * 100} />
        </div>
      </div>
    </div>
  );
};
