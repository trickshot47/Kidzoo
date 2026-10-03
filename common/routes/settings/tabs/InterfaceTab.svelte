<script>
  import { variables, setStyle, setScale } from '@/modules/themes.js'
  import { click } from '@/modules/lib/click.js'
  import HomeSections from '@/routes/settings/components/HomeSections.svelte'
  import { ELECTRON } from '@/modules/bridge.js'
  import SettingCard from '@/routes/settings/components/SettingCard.svelte'
  import { SUPPORTS } from '@/modules/support.js'
  import { Trash2, RotateCcw } from 'lucide-svelte'
  import { genreList, tagList } from '@/modules/anime/anime.js'
  import CustomDropdown from '@/components/CustomDropdown.svelte'
  import Helper from '@/modules/providers/helper.js'
  export let settings
  const listStatus = [['Watching', 'CURRENT'], ['Planning', 'PLANNING'], ['Paused', 'PAUSED'], ['Completed', 'COMPLETED'], ['Dropped', 'DROPPED'], ['Rewatching', 'REPEATING'], ['Not on List', 'NOTONLIST']]
</script>

<h4 class='mb-10 font-weight-bold'>Interface Settings</h4>
<SettingCard title='Theme' description='Select how the app looks and feels, including colors, layouts, and other visual styles.'>
  <select class='form-control bg-dark w-160 mw-full text-truncate' bind:value={settings.presetTheme} on:change={() => setStyle()}>
    <option value='default-dark' selected>Default (Dark)</option>
    <option value='default-amoled'>Default (AMOLED)</option>
  </select>
</SettingCard>
<SettingCard title='Scale' description='Adjust the size of text, buttons, and other interface elements to match your preference and screen size.'>
  <div class='form-group w-160 flex-shrink-0 my-auto'>
    <input class='w-full p-2 bg-dark-light' type='range' id='ui-scale' min='0.5' max='2' step='0.05' bind:value={settings.uiScale} on:change={() => setScale()}/>
    <div class='d-flex align-items-center justify-content-center gap-2 position-relative'>
      <strong>{Math.round(settings.uiScale * 100)}%</strong>
      <button type='button' use:click={() => { settings.uiScale = 1; setScale() }} class='btn btn-danger btn-square px-5 d-flex align-items-center position-absolute right-0' data-toggle='tooltip' data-placement='left' data-title='Reset To Default Interface Scaling' disabled={settings.uiScale === 1}><RotateCcw size='1.8rem' /></button>
    </div>
  </div>
</SettingCard>



{#if !Helper.isAniAuth()}
  <SettingCard title='Preferred Title Language' description='What title language to automatically select when displaying the title of an anime.'>
    <select class='form-control bg-dark mw-150 w-150' bind:value={settings.titleLang}>
      <option value='romaji' selected>Japanese</option>
      <option value='english'>English</option>
    </select>
  </SettingCard>
{/if}
<SettingCard title='Card Type' description='What type of cards to display in menus.'>
  <select class='form-control bg-dark w-100 mw-full text-truncate' bind:value={settings.cards}>
    <option value='small' selected>Small</option>
    <option value='full'>Full</option>
  </select>
</SettingCard>
{#if SUPPORTS.isAndroid && settings.cards === 'small'}
  <SettingCard title='Card Preview' description='If a detailed preview card should be shown when tapping or hovering over the small card.'>
    <div class='custom-switch fit-content'>
      <input type='checkbox' id='card-preview' bind:checked={settings.cardPreview} />
      <label for='card-preview'>{settings.cardPreview ? 'On' : 'Off'}</label>
    </div>
  </SettingCard>
{/if}
<SettingCard title='Card Audio' description='If the sub, dub, partial dub, and age rating icons should be shown on the cards, the corresponding episode number will be shown when possible. Additionally a label will be shown on the preview cards, anime view, episode cards, and the home banner of the highest possible audio available, either dub, partial dub, or sub. Note these will not be visible when viewing the schedule page.'>
  <div class='custom-switch fit-content'>
    <input type='checkbox' id='card-audio' bind:checked={settings.cardAudio} />
    <label for='card-audio'>{settings.cardAudio ? 'On' : 'Off'}</label>
  </div>
</SettingCard>
<SettingCard title='Prefer Dubs' description={'If your progress on a series matches the latest aired dubbed episode, the series will be hidden from Continue Watching until the next dub is available. Notifications will only be sent when a dubbed episode is released or if the series is sub-only (i.e., no dub exists).' + '\n\n' + 'If your progress goes beyond the latest dubbed episode, this setting will be ignored and the series will be treated as subbed. The Subbed Releases section will automatically hide dubbed series, and Dubbed Releases will hide subbed ones.' + '\n\n' + 'This setting is ideal for viewers who prefer dubbed content whenever available.'}>
  <div class='custom-switch fit-content'>
    <input type='checkbox' id='prefer-dubs' bind:checked={settings.preferDubs} />
    <label for='prefer-dubs'>{settings.preferDubs ? 'On' : 'Off'}</label>
  </div>
</SettingCard>
<SettingCard title='Spoiler Control' description={'Control how much episode and series information is hidden to avoid spoilers. Each level includes everything from the level below it, and only applies to anime matching your configured spoiler status.' + '\n\n' + 'Minimal hides episode images. Moderate additionally hides episode descriptions, review counts, and tags considered media spoilers. Strict additionally hides episode titles, anime synopsis, ratings, and tags considered general spoilers. Hermit additionally hides episode durations.'}>
  <select class='form-control bg-dark w-150 mw-full text-truncate' bind:value={settings.spoilers} on:change={(event) => { if (event.target.value === 'off') settings.spoilerStatus = [] }}>
    <option value='off' selected>Off</option>
    <option value='minimal'>Minimal</option>
    <option value='moderate'>Moderate</option>
    <option value='strict'>Strict</option>
    <option value='hermit'>Hermit</option>
  </select>
</SettingCard>
{#if settings.spoilers !== 'off'}
  <SettingCard title='Spoiler Status' description='Define which list status types should have spoiler control active. Spoilers will only be hidden for anime matching a selected status. For example, adding "Watching" means only currently watching series will have spoilers hidden, while everything else will show normally.'>
    <div>
      {#each settings.spoilerStatus as status, i (status)}
        <div class='input-group mb-10 w-210 mw-full'>
          <select id='spoiler-status-{i}' class='w-100 form-control mw-full bg-dark text-truncate' bind:value={settings.spoilerStatus[i]}>
            <option disabled value=''>Select a status</option>
            {#each listStatus.filter(option => option[1] !== 'COMPLETED').filter(option => !settings.spoilerStatus.includes(option[1]) || status === option[1]) as option (option[1])}
              <option value='{option[1]}'>{option[0]}</option>
            {/each}
          </select>
          <div class='input-group-append'>
            <button type='button' use:click={() => { settings.spoilerStatus.splice(i, 1); settings.spoilerStatus = settings.spoilerStatus }} class='btn btn-danger btn-square input-group-append px-5 d-flex align-items-center'><Trash2 size='1.8rem' /></button>
          </div>
        </div>
      {/each}
      <button type='button' disabled={listStatus.filter(option => option[1] !== 'COMPLETED').every(option => settings.spoilerStatus.includes(option[1]))} use:click={() => { settings.spoilerStatus = [...settings.spoilerStatus, ''] }} class='btn btn-primary mb-10 d-flex align-items-center justify-content-center'><span>Add Status</span></button>
    </div>
  </SettingCard>
{/if}
<SettingCard title='Adult Content' description='Adult enables searching for adult (18+) rated anime, typically series with nudity. Hentai enables searching straight up Hentai. This includes adding the Hentai home feed, Hentai genre, and Hentai related tags for search queries.'>
  <select class='form-control bg-dark w-100 mw-full text-truncate' bind:value={settings.adult}>
    <option value='none' selected>None</option>
    <option value='adult'>Adult</option>
    <option value='hentai'>Hentai</option>
  </select>
</SettingCard>
{#if settings.adult === 'hentai'}
  <SettingCard title='Hentai Banner' description='Changes the displayed series on the home page banner to be exclusively Hentai.'>
    <div class='custom-switch fit-content'>
      <input type='checkbox' id='hentai-banner' bind:checked={settings.hentaiBanner} />
      <label for='hentai-banner'>{settings.hentaiBanner ? 'On' : 'Off'}</label>
    </div>
  </SettingCard>
{/if}
<h4 class='mb-10 font-weight-bold'>Accessibility Settings</h4>
<SettingCard title='Show Labels' description='Shows additional text labels throughout the app for easier identification of buttons, icons and navigation.'>
  <div class='custom-switch fit-content'>
    <input type='checkbox' id='show-labels' bind:checked={settings.showLabels} on:change={() => setScale()} />
    <label for='show-labels'>{settings.showLabels ? 'On' : 'Off'}</label>
  </div>
</SettingCard>
<SettingCard title='Expandable Sidebar' description='Enables the sidebar to expand revealing detailed text for the navigation buttons.'>
  <div class='custom-switch fit-content'>
    <input type='checkbox' id='disable-sidebar' bind:checked={settings.expandingSidebar} />
    <label for='disable-sidebar'>{settings.expandingSidebar ? 'On' : 'Off'}</label>
  </div>
</SettingCard>
{#if SUPPORTS.isAndroid}
  <SettingCard title='Expandable Lists' description='Choose whether lists like recommendations or relations, open as dropdowns or scroll horizontally. Scrollable lists work better on smaller screens.'>
    <div class='custom-switch fit-content'>
      <input type='checkbox' id='toggle-list' bind:checked={settings.toggleList} />
      <label for='toggle-list'>{settings.toggleList ? 'On' : 'Off'}</label>
    </div>
  </SettingCard>
{/if}

<h4 class='mb-10 font-weight-bold'>Notification Settings</h4>
<SettingCard title='System Notifications' description='Allows custom system notifications to be sent, with this disabled you will still get in-app notifications. If you enable system notifications and have MULTIPLE Notification Feeds specified, such as RSS, Releases, and Anilist you WILL be spammed with multiple notifications. Consider choosing a single feed based on your needs.'>
  <div class='custom-switch fit-content'>
    <input type='checkbox' id='system-notify' bind:checked={settings.systemNotify} />
    <label for='system-notify'>{settings.systemNotify ? 'On' : 'Off'}</label>
  </div>
</SettingCard>
{#if Helper.isAniAuth()}
  <SettingCard title='AniList Notifications' description='Get notifications from your AniList account, showing when episodes have aired and any new anime titles you are following have been added to the database. Limited will only get important notifications like when a new season is announced.'>
    <select class='form-control bg-dark w-120 mw-120 mw-full text-truncate' bind:value={settings.aniNotify}>
      <option value='all' selected>All</option>
      <option value='limited'>Limited</option>
      <option value='none'>None</option>
    </select>
  </SettingCard>
{/if}
{#each ['Sub', 'Dub', 'Hentai'] as type (type)}
  {#if type !== 'Hentai' || settings.adult === 'hentai'}
    <SettingCard title='{type} Announcements' description={`Get ${type} announcement notifications when an airing date is confirmed. Choose to get all announcements, updates on sequels for related anime you're following, or turn off notifications entirely.`}>
      <select class='form-control bg-dark w-120 mw-120 text-truncate' bind:value={settings[`${type.toLowerCase()}Announce`]}>
        <option value='all' selected>All</option>
        <option value='following' selected>Following</option>
        <option value='none'>None</option>
      </select>
    </SettingCard>
  {/if}
{/each}


<h4 class='mb-10 font-weight-bold'>Home Screen Settings</h4>
{#if Helper.isAuthorized()}
  <SettingCard title='Hide My Anime' description='The anime on your Watching, Rewatching, Completed, and Dropped list will automatically be hidden from the default sections, this excludes manually added RSS feeds and user specific feeds.'>
    <div class='custom-switch fit-content'>
      <input type='checkbox' id='hide-my-anime' bind:checked={settings.hideMyAnime} />
      <label for='hide-my-anime'>{settings.hideMyAnime ? 'On' : 'Off'}</label>
    </div>
  </SettingCard>
{/if}

<SettingCard title='Custom Sections' description='Create custom sections that can be added to the home screen.'>
  <div>
    {#each settings.customSections as _, i (i)}
      {#if i === 0}
        <div class='d-flex mb-5 w-480 mw-full'>
          <div class='flex-shrink-1 w-150 font-size-16 text-center font-weight-bold'>Name</div>
          <div class='flex-shrink-1 w-150 font-size-16 text-center font-weight-bold'>Genres</div>
          <div class='flex-shrink-1 w-150 mr-5 font-size-16 text-center font-weight-bold'>Tags</div>
          <div class='flex-shrink-1 w-30 font-size-16 text-center font-weight-bold hidden'>&nbsp;</div>
        </div>
      {/if}
      <div class='d-flex mb-10 w-480 mw-full'>
        <div class='position-relative flex-shrink-1 w-150'>
          <input
            type='text'
            class='form-control bg-dark fix-border-right text-capitalize text-truncate'
            placeholder='Name'
            autocomplete='off'
            bind:value={settings.customSections[i][0]}
          />
        </div>
        <div class='position-relative flex-shrink-1 w-150'>
          <CustomDropdown id={`genre-is-${i}`} options={$genreList} bind:value={settings.customSections[i][1]} disabled={settings.customSections[i][1]?.includes('N/A')}/>
        </div>
        <div class='position-relative flex-shrink-1 w-150'>
          <CustomDropdown id={`tag-is-${i}`} options={$tagList} bind:value={settings.customSections[i][2]} disabled={settings.customSections[i][2]?.includes('N/A')}/>
        </div>
        <div class='input-group-append'>
          <button type='button' use:click={() => { settings.customSections.splice(i, 1); settings.customSections = settings.customSections }} class='btn btn-danger btn-square input-group-append px-5 d-flex align-items-center'><Trash2 size='1.8rem' /></button>
        </div>
      </div>
    {/each}
    <button type='button' use:click={() => { settings.customSections[settings.customSections.length] = ['New Section', [], [], [], []] }} class='btn btn-primary mb-10 d-flex align-items-center justify-content-center'><span>Add Section</span></button>
  </div>
</SettingCard>
<SettingCard title='Sections And Order' description="Sections and their order on the home screen, if you want more RSS feeds to show up here, create them first in the RSS feed list. Adding many multiple normal lists doesn't impact performance, but adding a lot of RSS feeds will impact app startup times. Drag/drop these sections to re-order them.">
  <div class='position-relative'>
    <HomeSections bind:homeSections={settings.homeSections} />
  </div>
</SettingCard>

<style>
  .w-210 {
    width: 21rem;
  }
  .w-480 {
    width: 48rem;
  }

  .fix-border-right {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
</style>
