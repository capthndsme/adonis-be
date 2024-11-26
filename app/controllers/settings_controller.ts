import type { HttpContext } from '@adonisjs/core/http'
import SettingsService, { Setting } from '../service/SettingsService.js'

export default class SettingsController {

  async getSettings() {
    const data = SettingsService.getSettings();
    return data;
  }

  async setSettings({request}: HttpContext) {
    const res = SettingsService.changeSetting(request.body() as Setting);
    return res;
  }

  /**
   * Presets.
   */

  async getPresets() {
    const data = await SettingsService.getPresets();
    return data;
  }

  async createPreset({request}: HttpContext) {
    const data = await SettingsService.createPreset(request.body());
    return data;
  }


  async deleteSetting({request}: HttpContext) {
    const {id} = request.params();
    const data = await SettingsService.deletePreset(Number(id));
    return data;
  }



}