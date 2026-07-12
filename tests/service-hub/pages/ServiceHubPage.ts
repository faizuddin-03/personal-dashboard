import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

export class ServiceHubPage extends BasePage {
  readonly softwareInstallationTile = this.page.getByText("SOFTWARE INSTALLATION", { exact: false });
  readonly biometricPurchaseTile = this.page.getByText("BIOMETRIC DEVICE PURCHASE", { exact: false });
  readonly serviceRequestListingTile = this.page.getByText("SERVICE REQUEST LISTING", { exact: false });

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.serviceHub);
  }

  async goToSoftwareInstallation() {
    await this.softwareInstallationTile.click();
    await this.waitForNav();
  }

  async goToBiometricPurchase() {
    await this.biometricPurchaseTile.click();
    await this.waitForNav();
  }

  async goToServiceRequestListing() {
    await this.serviceRequestListingTile.click();
    await this.waitForNav();
  }
}
