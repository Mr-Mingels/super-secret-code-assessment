<script lang="ts">
  export let className: string = ''
  export { className as class }
</script>

<div 
  class="{className} .relative .flex .h-10 .w-full .items-center .rounded-md .bg-black-100 .p-1"
  role="tablist"
  {...$$restProps}
>
  <div class=".relative .z-10 .flex .h-full .w-full .items-center .gap-2">
    <slot />
  </div>
</div>