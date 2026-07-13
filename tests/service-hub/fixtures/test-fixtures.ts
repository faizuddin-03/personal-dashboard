import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ServiceHubPage } from "../pages/ServiceHubPage";
import { SoftwareInstallationPage } from "../pages/SoftwareInstallationPage";
import { BiometricPurchasePage } from "../pages/BiometricPurchasePage";
import { ServiceRequestListingPage } from "../pages/ServiceRequestListingPage";
import { ServiceRequestDetailsPage } from "../pages/ServiceRequestDetailsPage";
import { ReschedulePage } from "../pages/ReschedulePage";
import { SlotPickerComponent } from "../pages/SlotPickerComponent";
import { AppointmentCalendarPage } from "../pages/bo/AppointmentCalendarPage";
import { SoftwareInstallationListingPage } from "../pages/bo/SoftwareInstallationListingPage";
import { SoftwareInstallationDetailsPage } from "../pages/bo/SoftwareInstallationDetailsPage";
import { ENV } from "../utils/config";

type ServiceHubFixtures = {
  loginPage: LoginPage;
  serviceHubPage: ServiceHubPage;
  softwareInstallationPage: SoftwareInstallationPage;
  biometricPurchasePage: BiometricPurchasePage;
  listingPage: ServiceRequestListingPage;
  requestDetailsPage: ServiceRequestDetailsPage;
  reschedulePage: ReschedulePage;
  slotPicker: SlotPickerComponent;
  boCalendarPage: AppointmentCalendarPage;
  boListingPage: SoftwareInstallationListingPage;
  boDetailsPage: SoftwareInstallationDetailsPage;

  /** Login as UCD and land on Service Hub */
  loggedInUCD: void;
  /** Login as BO */
  loggedInBO: void;
};

export const test = base.extend<ServiceHubFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  serviceHubPage: async ({ page }, use) => {
    await use(new ServiceHubPage(page));
  },
  softwareInstallationPage: async ({ page }, use) => {
    await use(new SoftwareInstallationPage(page));
  },
  biometricPurchasePage: async ({ page }, use) => {
    await use(new BiometricPurchasePage(page));
  },
  listingPage: async ({ page }, use) => {
    await use(new ServiceRequestListingPage(page));
  },
  requestDetailsPage: async ({ page }, use) => {
    await use(new ServiceRequestDetailsPage(page));
  },
  reschedulePage: async ({ page }, use) => {
    await use(new ReschedulePage(page));
  },
  slotPicker: async ({ page }, use) => {
    await use(new SlotPickerComponent(page));
  },
  boCalendarPage: async ({ page }, use) => {
    await use(new AppointmentCalendarPage(page));
  },
  boListingPage: async ({ page }, use) => {
    await use(new SoftwareInstallationListingPage(page));
  },
  boDetailsPage: async ({ page }, use) => {
    await use(new SoftwareInstallationDetailsPage(page));
  },

  loggedInUCD: async ({ loginPage, serviceHubPage }, use) => {
    await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
    await serviceHubPage.navigate();
    await use();
  },

  loggedInBO: async ({ loginPage }, use) => {
    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    await use();
  },
});

export { expect } from "@playwright/test";
