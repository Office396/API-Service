import Image from 'next/image';

export function Brand() {
  return <span className="inline-flex items-center gap-2.5"><Image src="/icon.svg" width={31} height={31} alt="" loading="eager" unoptimized /><span className="text-[22px] leading-none font-semibold tracking-[-.065em]">toolzync</span></span>;
}
