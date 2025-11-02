"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import GetToken from "@/lib/GetTokenClient";
import { activateCampaign, deactivateCampaign, deleteCampaign } from "@/lib/api/campaigns";

export default function CampaignRowActions({ campaign }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const TOKEN = GetToken();

  const handleToggleActive = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmed = confirm(
      campaign.active 
        ? `"${campaign.name}" урамшууллыг идэвхгүй болгох уу?\n\nЭнэ нь барааны үнийг дахин тооцоолох болно.`
        : `"${campaign.name}" урамшууллыг идэвхжүүлэх үү?\n\nЭнэ нь барааны үнийг шинэчлэх болно.`
    );
    
    if (!confirmed) return;

    startTransition(async () => {
      try {
        if (campaign.active) {
          await deactivateCampaign(campaign.id, TOKEN);
        } else {
          await activateCampaign(campaign.id, TOKEN);
        }
        router.refresh();
      } catch (error) {
        alert(`Алдаа гарлаа: ${error.message}`);
      }
    });
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmed = confirm(
      `"${campaign.name}" урамшууллыг устгах уу?\n\nЭнэ үйлдлийг буцаах боломжгүй!\n\nХамаарах барааны үнэ дахин тооцоологдох болно.`
    );
    
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteCampaign(campaign.id, TOKEN);
        router.refresh();
        router.push('/campaigns');
      } catch (error) {
        alert(`Алдаа гарлаа: ${error.message}`);
      }
    });
  };

  return (
    <>
      {/* Toggle Active/Inactive Button */}
      <button
        onClick={handleToggleActive}
        disabled={isPending}
        className="item"
        style={{
          border: 'none',
          background: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.5 : 1,
          color: campaign.active ? '#f59e0b' : '#10b981'
        }}
        title={campaign.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
      >
        <i className={campaign.active ? 'icon-pause-circle' : 'icon-play-circle'} />
      </button>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="item trash"
        style={{
          border: 'none',
          background: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.5 : 1
        }}
        title="Устгах"
      >
        <i className="icon-trash-2" />
      </button>
    </>
  );
}

