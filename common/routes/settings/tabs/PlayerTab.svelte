<script>
  import ClampedNumber from '@/components/inputs/ClampedNumber.svelte'
  import SettingCard from '@/routes/settings/components/SettingCard.svelte'
  import { SUPPORTS } from '@/modules/support.js'

  export let settings
</script>

<h4 class='mb-10 font-weight-bold'>Playback Settings</h4>
<SettingCard title='Autoplay Next Episode' description='Automatically starts playing next episode when a video ends.'>
  <div class='custom-switch fit-content'>
    <input type='checkbox' id='player-autoplay' bind:checked={settings.playerAutoplay} />
    <label for='player-autoplay'>{settings.playerAutoplay ? 'On' : 'Off'}</label>
  </div>
</SettingCard>

<SettingCard title='Auto-Complete Episodes' description='Automatically marks episodes as complete on AniList or MyAnimeList when you finish watching them. You must be logged in.'>
  <div class='custom-switch fit-content'>
    <input type='checkbox' id='player-autocomplete' bind:checked={settings.playerAutocomplete} />
    <label for='player-autocomplete'>{settings.playerAutocomplete ? 'On' : 'Off'}</label>
  </div>
</SettingCard>

{#if settings.playerAutocomplete}
  <SettingCard title='Auto-Complete Threshold' description='The percentage of an episode that must be watched before it is automatically marked as complete. A higher value means more of the episode must be watched.'>
    <div class='input-group w-100 mw-full'>
      <ClampedNumber bind:bindTo={settings.playerAutocompleteThreshold} min={1} max={100} class='form-control text-right bg-dark'/>
      <div class='input-group-append'>
        <span class='input-group-text bg-dark'>%</span>
      </div>
    </div>
  </SettingCard>
{/if}
